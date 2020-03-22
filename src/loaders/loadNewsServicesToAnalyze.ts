import { Observable, Subscriber } from "rxjs";
import { NewsService } from "../services/news";
import { NewsServiceLoader } from ".";
import newsApiServiceLoader from "./newsapi.loader";
import rssNewsServiceLoader from "./rss.loader";

const loaders: Array<NewsServiceLoader> = [
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

export default loadNewsServicesToAnalyze;