import loadNewsServicesToAnalyze from './loadNewsServicesToAnalyze';
import { Subscriber } from 'rxjs';
import { NewsService } from '../services/news';

export type NewsServiceLoader = (subscriber: Subscriber<NewsService>) => Promise<any> | any;

export default { loadNewsServicesToAnalyze };