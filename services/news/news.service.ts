import { Observable } from 'rxjs';

export interface News {
  title?: string;
  subtitle?: string;
  content: string;
}

export interface NewsService {
  getNewsObservable: () => Observable<News>;
}
