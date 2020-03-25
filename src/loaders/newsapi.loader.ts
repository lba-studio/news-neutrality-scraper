import { config } from "../config";
import { logger } from "../utils/logger.util";
import NewsApiService, { NewsApiSource } from "../services/news/newsapi.service";
import { NewsService } from "../services/news";
import { Subscriber } from "rxjs";

async function newsApiServiceLoader(subscriber: Subscriber<NewsService>) {
  const countries = [
    'us',
    'au',
  ];
  const excludedNewsSources = [ // this is a cost-saving measure more than anything else, because not a lot of people care about these sources. may need to restrict by category down the line
    'ars-technica',
    'bleacher-report',
    'breitbart-news',
    'crypto-coins-news',
    'endgadget',
    'espn',
    'espn-cric-info',
    'fox-sports',
    'mtv-news',
    'new-scientist',
    'nfl-news',
    'nhl-news',
    'polygon',
    'techcrunch',
    'the-american-conservative',
    'the-next-web',
  ];
  // loads NewsServices from NewsAPI.org
  let sources: Array<NewsApiSource> = await NewsApiService.getSources();
  let sourcesToLookFor = sources.filter(source => source.language === 'en')
    .filter(source => countries.includes(source.country))
    .filter(source => !excludedNewsSources.includes(source.id));
  if (config.isDev) {
    let sourceLimit = 3;
    logger.info(`Limiting source to ${sourceLimit} sources.`);
    sourcesToLookFor = sourcesToLookFor.slice(0, sourceLimit);
  }
  logger.debug(`Loaded ${sourcesToLookFor.length} sources from NewsAPI.org.`);
  sourcesToLookFor.forEach(source => subscriber.next(NewsApiService.craftNewsServiceFromNewsApiSource(source)));
}

export default newsApiServiceLoader;