import { analyzeText } from "./services/sentiment-analyzer.service";
import { News, NewsService } from "./services/news.service";
import { logger } from './utils/logger.util';
import { craftNewsServiceFromNewsApiSource, NewsApiService, NewsApiSource } from "./services/newsapi.service";
import { NewsSourceRepository, NewsSourceScore } from "./repositories/news-sources.repository";
import { Observable, Subscriber } from "rxjs";
import { map, mergeAll, concatAll } from 'rxjs/operators';
import { config } from './config';
import { APIGatewayProxyResult } from "aws-lambda";
import { handleError } from "./helpers/lambda.helper";

/**
 * most important function that people can contribute to.
 * this is the entry point of the function; it prepares the NewsServices, which are then piped
 * into retrieveScoreFromNewsService(). see handler().
 */
function loadNewsServicesToAnalyze(): Observable<NewsService> {
  return new Observable(subscriber => {
    Promise.all([
      (async () => {
        // loads NewsServices from NewsAPI.org
        let sources: Array<NewsApiSource> = await NewsApiService.getSources();
        let sourcesToLookFor = sources.filter(source => source.language === 'en');
        if (config.isDev) {
          let sourceLimit = 3;
          sourcesToLookFor = sourcesToLookFor.slice(0, sourceLimit);
        }
        sourcesToLookFor.forEach(source => subscriber.next(craftNewsServiceFromNewsApiSource(source)));
      })(),
    ]).then(() => subscriber.complete())
      .catch(e => subscriber.error(e));
  });
}

async function retrieveScoreFromNewsService(newsService: NewsService): Promise<number | undefined> {
  let avgScore: number | undefined = undefined;
  let counter = 0;
  await newsService.getNewsObservable().forEach((news: News) => {
    if (!news.content) {
      return;
    }
    let score = analyzeText(news.content);
    if (avgScore === undefined) {
      avgScore = score;
    } else {
      avgScore = (avgScore + score) / 2;
    }
    logger.trace(`${counter} texts analyzed! Avg score: ${avgScore}`);
    counter += 1;
  });
  return avgScore;
}

async function calculateNeutrality() {
  logger.info(config.newsApi);
  // get timestamp
  const timeStampMs = Date.now();
  await loadNewsServicesToAnalyze().pipe(
    map(async newsService => {
      let score: number | undefined;
      try {
        score = await retrieveScoreFromNewsService(newsService);
      } catch (e) {
        logger.error(e);
        score = undefined;
      }
      if (!score || Number.isNaN(score)) {
        logger.error(`Unable to retrieve score from domain ${newsService.sourceUrl} | ${newsService.sourceId}. Final score: ${score}`);
        return;
      }
      let newsSourceScore: NewsSourceScore = {
        id: newsService.sourceId,
        url: newsService.sourceUrl,
        score: score,
        retrievedFrom: 'https://newsapi.org',
        name: newsService.sourceName,
        country: newsService.sourceCountry,
        lastUpdatedMs: timeStampMs,
      };
      await NewsSourceRepository.put(newsSourceScore);
      return newsSourceScore;
    }),
    concatAll(),
  ).forEach(newsSourceScore => logger.debug('Calculated and stored news source score:', newsSourceScore));
  return {
    statusCode: 204,
    body: '',
  };
}

export const handler = handleError(calculateNeutrality);

if (!module.parent) {
  logger.info('Executing neutrality calculation script.');
  calculateNeutrality()
    .then(() => logger.info('Finished!'))
    .catch(e => {
      console.error('Oops! Encountered error:');
      logger.error(e);
    });
}
