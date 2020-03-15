
import './utils/setupTest';
import * as calculateNeutrality from './calculate-neutrality';
import * as loadNewsServicesToAnalyze from './utils/loadNewsServicesToAnalyze';
import sinon from 'sinon';
import { NewsService, News } from './services/news';
import { Observable } from 'rxjs';
import sentimentAnalyzerService from './services/sentiment-analyzer.service';
import { NewsSourceRepository, NewsSourceScore } from './repositories/news-sources.repository';
import { expect } from 'chai';

describe('calculate-neutrality', () => {
  beforeEach(() => {
    sinon.restore();
  });

  it('should retrieve scores from news services correctly', async () => {
    const expectedScore = 0;
    const stubNewsService: NewsService = {
      getNewsObservable: () => new Observable(subscriber => {
        subscriber.next({
          title: 'test1',
          content: 'testcontent',
        });
        subscriber.complete();
      }),
      sourceId: 'stubId',
      sourceUrl: 'stub.com',
      sourceCountry: 'en',
      sourceProvider: 'stubz',
      sourceName: 'Stubby McStub',
    };
    sinon.stub(loadNewsServicesToAnalyze, 'default').callsFake(() => {
      return new Observable<NewsService>(subscriber => {
        subscriber.next(stubNewsService);
        subscriber.complete();
      });
    });
    sinon.stub(sentimentAnalyzerService, 'analyzeText').callsFake(async (text) => expectedScore);
    const putStub = sinon.stub(NewsSourceRepository, 'put');
    await calculateNeutrality.calculateNeutrality();
    sinon.assert.calledOnceWithExactly(putStub, sinon.match({
      id: stubNewsService.sourceId,
      url: stubNewsService.sourceUrl,
      score: expectedScore,
      retrievedFrom: stubNewsService.sourceProvider,
      name: stubNewsService.sourceName,
      country: stubNewsService.sourceCountry,
    }).and(sinon.match.has('lastUpdatedMs', sinon.match.number)));
  });
});