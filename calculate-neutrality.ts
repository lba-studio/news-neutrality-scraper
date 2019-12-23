import { analyzeText } from "./services/sentiment-analyzer.service";
import { AbcNewsService } from "./services/news/abcnews.service";
import { News, NewsService } from "./services/news/news.service";
import { logger } from './utils/logger.util';
import config from "./config";
import { craftNewsServiceFromNewsApiSources, NewsApiService, NewsApiSource } from "./services/newsapi.service";
import { NewsSourceRepository } from "./repositories/news-sources.repository";

// const domainsToLookFor = [
//   // 'abc.net.au',
//   // 'foxnews.com',
//   // 'bloomberg.com', CONTENT NOT AVAILABLE
//   'buzzfeed.com',
// ];

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

async function handler() {
  let sources: Array<NewsApiSource> = await NewsApiService.getSources();
  let sourcesToLookFor = sources.filter(source => source.language === 'en');
  if (true) {
    const sourceLimit = 1;
    logger.info(`Limiting source to ${sourceLimit}.`);
    sourcesToLookFor = sourcesToLookFor.slice(0, Math.min(sourceLimit, sourcesToLookFor.length));
  }
  await Promise.all(sourcesToLookFor.map(async source => {
    let score = await retrieveScoreFromNewsService(craftNewsServiceFromNewsApiSources([source.id]));
    if (!score || Number.isNaN(score)) {
      logger.error(`Unable to retrieve score from domain ${source.url} | ${source.id}. Final score: ${score}`);
      return;
    }
    logger.info(`Domain: ${source.url} | ${source.id} | Score: ${score}`);
    await NewsSourceRepository.put({
      id: source.id,
      url: source.url,
      score: score,
    });
    logger.debug(`Stored data for domain ${source.url} | ${source.id}.`);
  }));
}

handler()
  .then(() => logger.info('Finished!'))
  .catch(e => {
    console.error('Oops! Encountered error:');
    logger.error(e);
  });
