import axios, { AxiosResponse } from 'axios';
import config from '../config';
import { NewsApiError } from '../errors';

interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: Array<NewsApiArticle>
};

interface NewsApiArticle {
  source: {
    id?: string;
    name: string;
  },
  author?: string;
  title: string;
  description: string;
  url: string;
};

const url = config.newsApi.url;
const apiKey = config.newsApi.apiKey;

function handleErrorStatusCode(resp: AxiosResponse): AxiosResponse {
  if (resp.status >= 400) {
    throw new NewsApiError(`Error status code: ${resp.status} - ${resp.statusText}`);
  }
  return resp;
}

export async function getNewsFromSource(sources: Array<string>): Promise<NewsApiResponse> {
  return await axios.get(url + '/everything', {
    params: {
      apiKey: apiKey,
      sources: sources.join(','),
    }
  }).then(handleErrorStatusCode)
  .then(resp => resp.data);
}