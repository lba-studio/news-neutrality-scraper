import { Observable } from "rxjs";
import { config } from '../config'
import { NewsService } from "../services/news";
import { NewsApiSource, NewsApiService, craftNewsServiceFromNewsApiSource } from "../services/news/newsapi.service";
import { logger } from "./logger.util";

/**
 * most important function that people can contribute to.
 * this is the entry point of the function; it prepares the NewsServices, which are then piped
 * into retrieveScoreFromNewsService(). see handler().
 */
function loadNewsServicesToAnalyze(): Observable<NewsService> {
  return new Observable(subscriber => {
    Promise.all([
      (async () => {
        const countries = [
          'us',
          'au',
        ];
        // loads NewsServices from NewsAPI.org
        let sources: Array<NewsApiSource> = await NewsApiService.getSources();
        let sourcesToLookFor = sources.filter(source => source.language === 'en')
          .filter(source => countries.includes(source.country));
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

export default loadNewsServicesToAnalyze;