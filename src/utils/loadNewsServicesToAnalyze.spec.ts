import './setupTest';
import sinon from 'sinon';
import { NewsApiService, NewsApiSource } from '../services/news/newsapi.service';
import loadNewsServicesToAnalyze from './loadNewsServicesToAnalyze';
import { expect } from 'chai';

describe('loadNewsServicesToAnalyze', () => {
  it('should load news services successfully and filter by country and language', async () => {
    sinon.stub(NewsApiService, 'getSources').callsFake((): Promise<Array<NewsApiSource>> => {
      return Promise.resolve([
        {
          id: 'test1',
          name: 'test1',
          description: '',
          url: 'test1.com',
          country: 'au',
          language: 'en',
        },
        {
          id: 'test2',
          name: 'test2',
          description: '',
          url: 'test2.com',
          country: 'it',
          language: 'en',
        },
        {
          id: 'test3',
          name: 'test3',
          description: '',
          url: 'test3.com',
          country: 'us',
          language: 'en',
        },
        {
          id: 'test4',
          name: 'test4',
          description: '',
          url: 'test4.com',
          country: 'us',
          language: 'it',
        }
      ]);
    });
    const newsServices$ = loadNewsServicesToAnalyze();
    await newsServices$.forEach(newsService => {
      expect(['au', 'us']).to.include(newsService.sourceCountry);
      expect(['test1', 'test2', 'test3']).to.include(newsService.sourceId); // tests the language
    });
  });
});