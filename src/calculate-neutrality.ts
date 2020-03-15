import sentimentAnalyzerService from "./services/sentiment-analyzer.service";
import { News, NewsService } from "./services/news";
import { logger } from './utils/logger.util';
import { NewsSourceRepository, NewsSourceScore } from "./repositories/news-sources.repository";
import { map, concatAll, filter } from 'rxjs/operators';
import { config } from './config';
import { defaultApiResponseHandler } from "./helpers/lambda.helper";
import loadNewsServicesToAnalyze from "./utils/loadNewsServicesToAnalyze";

async function retrieveScoreFromNewsService(newsService: NewsService): Promise<number | undefined> {
  let avgScore: number | undefined = undefined;
  let counter = 0;
  await newsService.getNewsObservable().pipe(
    map(async (news: News): Promise<number | undefined> => {
      return sentimentAnalyzerService.analyzeText(news.content).catch(e => {
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

export async function calculateNeutrality() {
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
        retrievedFrom: newsService.sourceProvider,
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
