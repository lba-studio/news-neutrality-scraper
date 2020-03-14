import { analyzeText } from "./services/sentiment-analyzer.service";
import { News, NewsService } from "./services/news";
import { logger } from './utils/logger.util';
import { craftNewsServiceFromNewsApiSource, NewsApiService, NewsApiSource } from "./services/news/newsapi.service";
import { NewsSourceRepository, NewsSourceScore } from "./repositories/news-sources.repository";
import { Observable } from "rxjs";
import { map, concatAll, filter } from 'rxjs/operators';
import { config } from './config';
import { defaultApiResponseHandler } from "./helpers/lambda.helper";

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
          logger.info(`Limiting source to ${sourceLimit} sources.`);
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
  await newsService.getNewsObservable().pipe(
    map(async (news: News): Promise<number | undefined> => {
      return analyzeText(news.content).catch(e => {
        logger.error(`Unable to retrieve score for ${newsService.sourceId}:`, e);
        return undefined;
      });
    }),
    concatAll()
  ).forEach(score => {
    if (score === undefined) {
      avgScore = undefined;
      throw new Error(`Undefined score for ${newsService.sourceId}.`);
    }
    if (avgScore === undefined) {
      avgScore = score;
    } else {
      avgScore = (avgScore + score) / 2;
    }
    logger.debug(`${counter} texts analyzed! Avg score: ${avgScore}`);
    counter += 1;
  }).catch(e => logger.error(e));
  return avgScore;
}

async function calculateNeutrality() {
  logger.info(config.newsApi);
  // get timestamp
  const timeStampMs = Date.now();
  logger.info('Calculating neutrality...');
  await loadNewsServicesToAnalyze().pipe(
    map(async newsService => {
      logger.debug('Analysing news service');
      let score: number;
      try {
        let result = await retrieveScoreFromNewsService(newsService);
        if (result === undefined || Number.isNaN(result)) {
          throw new Error(`Unable to retrieve score from domain ${newsService.sourceUrl} | ${newsService.sourceId}. Final score: ${result}`);
        }
        score = result;
      } catch (e) {
        logger.error(e);
        return undefined;
      }
      logger.debug('Done score calculation');
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
    filter(score => score !== undefined)
  ).forEach(newsSourceScore => logger.debug('Calculated and stored news source score:', newsSourceScore));
}

export const handler = defaultApiResponseHandler(calculateNeutrality);

if (!module.parent) {
  logger.info('Executing neutrality calculation script.');
  calculateNeutrality()
    .then(() => logger.info('Finished!'))
    .catch(e => {
      logger.error(e);
    });
}
