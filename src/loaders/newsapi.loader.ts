import { config } from "../config";
import { logger } from "../utils/logger.util";
import { NewsApiService, NewsApiSource, craftNewsServiceFromNewsApiSource } from "../services/news/newsapi.service";
import { NewsService } from "../services/news";
import { Subscriber } from "rxjs";

async function newsApiServiceLoader(subscriber: Subscriber<NewsService>) {
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
};

export default newsApiServiceLoader;