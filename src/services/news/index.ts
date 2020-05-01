import { Observable } from 'rxjs';

export interface News {
  title: string;
  content: string;
}

export interface OnlineNewsArticle extends News {
  sourceName: string;
  imageUrl?: string;
  url?: string;
}

export interface NewsService {
  getNewsObservable: () => Observable<News>;
  sourceId: string;
  sourceUrl: string;
  sourceProvider?: string; // e.g. https://newsapi.org; undefined = it is provided internally (through puppeteer/selenium perhaps?)
  sourceName: string;
  sourceCountry: string;
}