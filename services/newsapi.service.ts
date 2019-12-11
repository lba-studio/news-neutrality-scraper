import axios, { AxiosResponse } from 'axios';
import config from '../config';
import { NewsApiError } from '../errors';

const sources = [ // TODO get rid of this
  'abc-news-au',
];
const url = config.newsApi.url;
const apiKey = config.newsApi.apiKey;
// const url = 'https://newsapi.org/v2/everything?q=bitcoin&apiKey=167104b8cc724ae2a0fa9f5ac3ab2ffd';

function handleErrorStatusCode(resp: AxiosResponse): AxiosResponse {
  if (resp.status >= 400) {
    throw new NewsApiError(`Error status code: ${resp.status} - ${resp.statusText}`);
  }
  return resp;
}

export async function getNewsFromSource(source: string) {
  return await axios.get(url + '/everything', {
    params: {
      apiKey: apiKey,
      sources: sources.join(','), // TODO remove this
    }
  }).then(handleErrorStatusCode)
  .then(resp => resp.data);
}