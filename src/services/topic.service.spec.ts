import sinon from "sinon";
import topicService, { GetTopicResult } from "./topic.service";
import newsapiService, { NewsApiArticle } from "./news/newsapi.service";
import sentimentAnalyzerService from "./sentiment-analyzer.service";
import topicScoreRepository from "../repositories/topic-score.repository";
import { expect } from "chai";

describe("topic.service", () => {
  beforeEach(() => {
    sinon.restore();
  });

  it("should calculate the average score of each news articles for a particular topic", async () => {
    const topic = "huehue";
    const news: Array<NewsApiArticle> = [
      {
        content: "huehue",
        title: "title1",
        source: { name: "huehue" },
        url: "test",
        urlToImage: "test",
      },
      {
        content: "wassup",
        title: "title2",
        source: { name: "wassup" },
        url: "test2",
        urlToImage: "test2",
      },
    ];
    const expectedResult: GetTopicResult = {
      score: 0.5,
      newsArticlesAnalyzed: 2,
      sampleAnalyzedArticles: news.map(newsapiService.toOnlineNewsArticle),
    };
    sinon.stub(newsapiService, "getNews").returns(Promise.resolve(news));
    sinon
      .stub(sentimentAnalyzerService, "analyzeText")
      .onCall(0)
      .returns(Promise.resolve(1))
      .onCall(1)
      .returns(Promise.resolve(0));
    const putStub = sinon.stub(topicScoreRepository, "put");
    const result = await topicService.getTopicScore(topic);
    expect(putStub.calledOnceWith({ score: 0.5, topic: topic })).to.be.true;
    expect(result).to.deep.equal(expectedResult);
  });

  it("should return appropriately when no news could be found", async () => {
    const topic = "huehue";
    const news = [];
    const expectedResult: GetTopicResult = {
      score: null,
      newsArticlesAnalyzed: 0,
      sampleAnalyzedArticles: [],
    };
    sinon.stub(newsapiService, "getNews").returns(Promise.resolve(news));
    const analyzeTextStub = sinon.stub(sentimentAnalyzerService, "analyzeText");
    const putStub = sinon.stub(topicScoreRepository, "put");
    const result = await topicService.getTopicScore(topic);
    expect(putStub.called).to.be.false;
    expect(analyzeTextStub.called).to.be.false;
    expect(result).to.deep.equal(expectedResult);
  });
});
