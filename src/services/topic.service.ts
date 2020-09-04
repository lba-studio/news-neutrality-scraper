import { OnlineNewsArticle } from "./news";
import sentimentAnalyzerService from "./sentiment-analyzer.service";
import newsApiService from "./news/newsapi.service";
import topicScoreRepository from "../repositories/topic-score.repository";

export type GetTopicResult = {
  score: number | null;
  newsArticlesAnalyzed: number;
  sampleAnalyzedArticles: Array<OnlineNewsArticle>;
};

async function getTopicScore(
  topic: string,
  shouldStoreTopic = true
): Promise<GetTopicResult> {
  const newsApiResult = await newsApiService.getNews({
    qInTitle: topic,
    page: 1,
    pageSize: 50,
    language: "en",
    sortBy: "publishedAt",
  });
  const newsArr = newsApiResult.map(newsApiService.toOnlineNewsArticle);
  const newsScores = await Promise.all(
    newsArr.map((news) =>
      sentimentAnalyzerService.analyzeText(news.title || news.content)
    )
  );
  const firstScore = newsScores.pop();
  const sampleAnalyzedArticles = newsArr;
  if (firstScore === undefined) {
    return {
      score: null,
      newsArticlesAnalyzed: 0,
      sampleAnalyzedArticles: sampleAnalyzedArticles,
    };
  }
  const numberOfNewsArticlesAnalyzed = newsScores.length + 1;
  const avgScore =
    newsScores.reduce((accumulator, score) => accumulator + score, firstScore) /
    numberOfNewsArticlesAnalyzed;
  if (shouldStoreTopic) {
    await topicScoreRepository.put({
      score: avgScore,
      topic: topic,
    });
  }
  return {
    score: avgScore,
    newsArticlesAnalyzed: numberOfNewsArticlesAnalyzed,
    sampleAnalyzedArticles: sampleAnalyzedArticles,
  };
}

export default {
  getTopicScore,
};
