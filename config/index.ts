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
  }
}

export default config;