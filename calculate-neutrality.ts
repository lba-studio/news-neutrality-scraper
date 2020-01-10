import { analyzeText } from "./services/sentiment-analyzer.service";
import { News, NewsService } from "./services/news.service";
import { logger } from './utils/logger.util';
import { craftNewsServiceFromNewsApiSources, NewsApiService, NewsApiSource } from "./services/newsapi.service";
import { NewsSourceRepository, NewsSourceScore } from "./repositories/news-sources.repository";
import { Observable, Subscriber } from "rxjs";
import { map, mergeAll, concatAll } from 'rxjs/operators';
import config from './config';

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
          sourcesToLookFor = sources.slice(0, sourceLimit);
        }
        sourcesToLookFor.forEach(source => subscriber.next(craftNewsServiceFromNewsApiSources([source])));
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
    logger.debug(`${counter} texts analyzed! Avg score: ${avgScore}`);
    counter += 1;
  });
  return avgScore;
}

export async function handler() {
  await loadNewsServicesToAnalyze().pipe(
    map(async newsService => {
      let score = await retrieveScoreFromNewsService(newsService);
      if (!score || Number.isNaN(score)) {
        logger.error(`Unable to retrieve score from domain ${newsService.sourceUrl} | ${newsService.sourceId}. Final score: ${score}`);
        return;
      }
      let newsSourceScore: NewsSourceScore = {
        id: newsService.sourceId,
        url: newsService.sourceUrl,
        score: score,
        retrievedFrom: 'https://newsapi.org'
      };
      await NewsSourceRepository.put(newsSourceScore);
      return newsSourceScore;
    }),
    concatAll(),
  ).forEach(newsSourceScore => logger.debug('Calculated and stored news source score:', newsSourceScore));
}

if (!module.parent) {
  handler()
    .then(() => logger.info('Finished!'))
    .catch(e => {
      console.error('Oops! Encountered error:');
      logger.error(e);
    });
}
