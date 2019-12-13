import axios, { AxiosResponse } from 'axios';
import config from '../config';
import { NewsApiError } from '../errors';
import { News, NewsService } from './news/news.service';
import { Observable } from 'rxjs';
import { logger } from '../utils/logger.util';

export interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: Array<NewsApiArticle>
};

export interface NewsApiArticle {
  source: {
    id?: string;
    name: string;
  },
  author?: string;
  title: string;
  description: string;
  url: string;
};

interface NewsApiQueryParam {
  domains?: string; // delimited by ,
  sources?: string; // delimited by ,
  pageSize?: number;
  page?: number;
};

const url = config.newsApi.url;
const apiKey = config.newsApi.apiKey;
const pageLimit = config.newsApi.pageLimit;

function handleErrorStatusCode(resp: AxiosResponse): AxiosResponse {
  if (resp.status >= 400) {
    throw new NewsApiError(`Error status code: ${resp.status} - ${resp.statusText}`);
  }
  return resp;
}

export async function getNewsFromSource(params?: NewsApiQueryParam): Promise<NewsApiResponse> {
  return await axios.get(url + '/everything', {
    params: params,
    headers: {
      'Authorization': apiKey,
    },
  }).then(resp => resp.data)
  .catch(e => {
    if (e.response) {
      logger.error(e.response.data);
    }
    throw e;
  });
}

export function getNewsApiObservableForDomains(domains: Array<string>): Observable<News> {
  return new Observable(subscriber => {
    (async () => {
      let data: NewsApiResponse;
      let pageNumber = 1;
      const pageSize = 100;
      do {
        data = await NewsApiService.getNewsFromSource({
          domains: domains.join(','),
          page: pageNumber++,
          pageSize: pageSize,
        });
        data.articles.forEach(article => subscriber.next({
          content: article.description,
          title: article.title,
        }));
      } while (data.articles.length > 0 && pageNumber * pageSize <= pageLimit)
    })().then(() => subscriber.complete());
  });
}

export function craftNewsService(domains: Array<string>): NewsService {
  return {
    getNewsObservable: () => getNewsApiObservableForDomains(domains),
  };
}

export const NewsApiService = { getNewsFromSource, getNewsApiObservableForDomains };