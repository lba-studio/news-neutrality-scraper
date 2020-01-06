import { NewsSourcesSchema } from './dynamo-schemas'
import dotenv from 'dotenv';
import { logger } from '../utils/logger.util';

const result = dotenv.config();

if (result.error) {
  logger.warn(`Cannot load .env file: ${result.error.message}`);
}

function getEnv(envVarKey: string): string {
  let envVar = process.env[envVarKey];
  if (envVar === undefined) {
    throw new Error(`Missing environment variable: ${envVarKey}`);
  }
  return envVar;
}

const config = {
  newsApi: {
    apiKey: getEnv('NEWS_API_APIKEY'),
    url: getEnv('NEWS_API_URL'),
    pageLimit: 100,
  },
  db: {
    tableNames: {
      newsSources: NewsSourcesSchema.TableName,
    },
    localEndpoint: process.env.NODESCRAPE_LOCAL_ENDPOINT,
  }
}

export default config;