import { Subscriber, Observable } from 'rxjs';
import { NewsService } from '../services/news';
import newsApiServiceLoader from './newsapi.loader';
import rssNewsServiceLoader from './rss.loader';

export type NewsServiceLoader = (subscriber: Subscriber<NewsService>) => Promise<any> | any;

const loaders: Array<NewsServiceLoader> = [
  // add any loaders here
  newsApiServiceLoader,
  rssNewsServiceLoader,
];

/**
 * most important function that people can contribute to.
 * this is the entry point of the function; it prepares the NewsServices, which are then piped
 * into retrieveScoreFromNewsService(). see handler().
 */
function loadNewsServicesToAnalyze(): Observable<NewsService> {
  return new Observable(subscriber => {
    Promise.all(loaders.map(loader => loader(subscriber)))
      .then(() => subscriber.complete())
      .catch(e => subscriber.error(e));
  });
}

export default { loadNewsServicesToAnalyze };