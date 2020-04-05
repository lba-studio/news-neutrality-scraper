import { NewsSourcesSchema } from './dynamo-schemas'
import dotenv from 'dotenv';

const result = dotenv.config();

if (result.error) {
  console.warn(`Cannot load .env file: ${result.error.message}`);
}


function toBoolean(envVar?: string): boolean {
  return envVar === 'true';
}

// added because env vars should not be necessary for tests
const SHOULD_SKIP_VALIDATION = toBoolean(process.env.NODESCRAPE_SKIP_ENV_VALIDATION);

if (SHOULD_SKIP_VALIDATION) {
  console.warn('WARN: NODESCRAPE_SKIP_ENV_VALIDATION is set to true. Env var validations will be skipped.');
}

function getRequiredEnvironmentVariable(envVarKey: string, shouldThrowWhenMissing = SHOULD_SKIP_VALIDATION): string {
  let envVar = process.env[envVarKey];
  if (envVar === undefined) {
    const errorMessage = `Missing environment variable: ${envVarKey}`;
    if (shouldThrowWhenMissing) {
      throw new Error(errorMessage);
    } else {
      console.warn('WARN:', errorMessage);
    }
  }
  return envVar as string;
}

export const config = {
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
};