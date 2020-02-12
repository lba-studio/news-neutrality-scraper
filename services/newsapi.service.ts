import axios, { AxiosResponse } from 'axios';
import { config } from '../config';
import { NewsApiError } from '../errors';
import { News, NewsService } from './news.service';
import { Observable, throwError } from 'rxjs';
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
  description?: string;
  url: string;
  content?: string;
};

export interface NewsApiSource {
  id: string;
  name: string;
  description: string;
  url: string;
  country: string;
  language: string;
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

export function getNewsApiObservableForDomains(sources: Array<string>): Observable<News> {
  return new Observable(subscriber => {
    (async () => {
      let data: NewsApiResponse;
      let pageNumber = 1;
      const pageSize = 100;
      do {
        data = await NewsApiService.getNewsFromSource({
          sources: sources.join(','),
          page: pageNumber++,
          pageSize: pageSize,
        });
        data.articles.forEach(article => {
          let content = article.description || article.content;
          let title = article.title;
          if (!content || !title) {
            console.dir(article, { depth: null });
            throw new Error(`Empty content or title for source ${sources.toString()}!`);
          }
          subscriber.next({
            content: content,
            title: title,
          });
        });
      } while (data.articles.length > 0 && pageNumber * pageSize <= pageLimit)
    })().then(() => subscriber.complete())
    .catch(e => subscriber.error(e));
  });
}

export function craftNewsServiceFromNewsApiSources(sources: Array<NewsApiSource>): NewsService {
  return {
    getNewsObservable: () => getNewsApiObservableForDomains(sources.map(source => source.id)),
    sourceUrl: sources.map(source => source.url).join(','),
    sourceId: sources.map(source => source.id).join(','),
    sourceProvider: 'https://newsapi.org',
  };
}

export async function getSources(country?: string): Promise<Array<NewsApiSource>> {
  return await axios.get(url + '/sources', {
    params: {
      country: country
    },
    headers: {
      'Authorization': apiKey,
    },
  }).then(resp => {
    if (!resp.data.sources) {
      throw new NewsApiError('Unable to retrieve sources.');
    }
    return resp.data.sources;
  }).catch(e => {
    if (e.response) {
      logger.error(e.response.data);
    }
    throw e;
  });
}

export const NewsApiService = { getNewsFromSource, getNewsApiObservableForDomains, getSources };