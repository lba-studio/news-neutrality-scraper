import { NewsService } from "./news.service";
import { Observable } from 'rxjs';
import { NewsApiService, NewsApiResponse } from "../newsapi.service";

const domain = 'foxnews.com';

export const FoxNewsService: NewsService = {
  getNewsObservable: () => NewsApiService.getNewsApiObservableForDomains([domain]),
};