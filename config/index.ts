import { NewsSourcesSchema } from './dynamo-schemas'
import dotenv from 'dotenv';
import { logger } from '../utils/logger.util';

const result = dotenv.config();

if (result.error) {
  logger.warn(`Cannot load .env file: ${result.error.message}`);
}

function getRequiredEnvironmentVariable(envVarKey: string): string {
  let envVar = process.env[envVarKey];
  if (envVar === undefined) {
    throw new Error(`Missing environment variable: ${envVarKey}`);
  }
  return envVar;
}

function toBoolean(envVar?: string): boolean {
  return envVar === 'true';
}

const config = {
  newsApi: {
    apiKey: getRequiredEnvironmentVariable('NEWS_API_APIKEY'),
    url: getRequiredEnvironmentVariable('NEWS_API_URL'),
    pageLimit: 100,
  },
  db: {
    tableNames: {
      newsSources: NewsSourcesSchema.TableName,
    },
    localEndpoint: process.env.NODESCRAPE_LOCAL_ENDPOINT,
  },
  isDev: toBoolean(process.env.NODESCRAPE_IS_DEVELOPMENT),
  logLevel: process.env.NODESCRAPE_LOG_LEVEL || 'info',
}

export default config;