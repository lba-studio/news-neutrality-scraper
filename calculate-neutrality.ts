import { analyzeText } from "./services/sentiment-analyzer.service";
import { AbcNewsService } from "./services/news/abcnews.service";
import { News, NewsService } from "./services/news/news.service";
import { logger } from './utils/logger.util';
import config from "./config";
import { craftNewsService } from "./services/newsapi.service";

const domainsToLookFor = [
  // 'abc.net.au',
  'foxnews.com',
];

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
  logger.info(config.newsApi.apiKey);
  await Promise.all(domainsToLookFor.map(async domain => {
    let score = await retrieveScoreFromNewsService(craftNewsService([domain]));
    logger.info(`Domain: ${domain} | Score: ${score}`)
  }));
}

handler()
  .then(() => logger.info('Finished!'))
  .catch(e => {
    console.error('Oops! Encountered error:');
    logger.error(e);
  });
