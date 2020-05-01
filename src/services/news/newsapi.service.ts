import axios from '../../clients/axios.client';
import { config } from '../../config';
import { NewsApiError } from '../../errors';
import { News, NewsService, OnlineNewsArticle } from '.';
import { Observable } from 'rxjs';
import { logger } from '../../utils/logger.util';

export interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: Array<NewsApiArticle>;
}

export interface NewsApiArticle {
  source: {
    id?: string;
    name: string;
  };
  author?: string;
  title: string;
  description?: string;
  url: string;
  content?: string;
  urlToImage: string;
}

export interface NewsApiSource {
  id: string;
  name: string;
  description: string;
  url: string;
  country: string;
  language: string;
}

interface NewsApiQueryParam {
  domains?: string; // delimited by ,
  sources?: string; // delimited by ,
  pageSize?: number;
  page?: number;
  q?: string; // keywords or phrases to search for in the article title and body.
  language?: string;
}

const url = config.newsApi.url;
const apiKey = config.newsApi.apiKey;
const pageLimit = config.newsApi.pageLimit;

export async function getEveryNews(params?: NewsApiQueryParam): Promise<NewsApiResponse> {
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

export async function getTopHeadlines(params?: NewsApiQueryParam): Promise<NewsApiResponse> {
  return await axios.get(url + '/top-headlines', {
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

function toNews(article: NewsApiArticle): News {
  const content = article.description || article.content;
  const title = article.title;
  if (!content || !title) {
    console.dir(article, { depth: null });
    throw new Error(`Empty content or title!`);
  }
  return {
    content: content,
    title: title,
  };
}

function toOnlineNewsArticle(article: NewsApiArticle): OnlineNewsArticle {
  return {
    ...toNews(article),
    sourceName: article.source.name,
    imageUrl: article.urlToImage,
    url: article.url,
  };
}

export async function getNews(params: NewsApiQueryParam): Promise<Array<NewsApiArticle>> {
  const result = await getTopHeadlines(params)
  return result.articles
    .filter(article => article.content && article.description && article.title);
}

export function getNewsApiObservableForDomains(sources: Array<string>): Observable<News> {
  return new Observable(subscriber => {
    (async () => {
      let data: NewsApiResponse;
      let pageNumber = 1;
      const pageSize = 50; // max is 100, but after 50 it's not too relevant
      do {
        data = await getEveryNews({
          sources: sources.join(','),
          page: pageNumber++,
          pageSize: pageSize,
        });
        data.articles.forEach(article => {
          try {
            const news = toNews(article);
            subscriber.next(news);
          } catch (e) {
            throw new Error(`Sources: ${sources} | ${e.message || JSON.stringify(e)}`)
          }
        });
      } while (data.articles.length > 0 && pageNumber * pageSize <= pageLimit)
    })().then(() => subscriber.complete())
      .catch(e => subscriber.error(e));
  });
}

export function craftNewsServiceFromNewsApiSource(source: NewsApiSource): NewsService {
  return {
    getNewsObservable: () => getNewsApiObservableForDomains([source.id]),
    sourceUrl: source.url,
    sourceId: source.id,
    sourceProvider: 'https://newsapi.org',
    sourceName: source.name,
    sourceCountry: source.country,
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

export default {
  craftNewsServiceFromNewsApiSource,
  getEveryNews,
  getNewsApiObservableForDomains,
  getSources,
  getNews,
  toOnlineNewsArticle,
};