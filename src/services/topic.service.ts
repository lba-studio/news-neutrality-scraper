import { OnlineNewsArticle } from "./news";
import sentimentAnalyzerService from "./sentiment-analyzer.service";
import newsApiService from "./news/newsapi.service";
import topicScoreRepository from "../repositories/topic-score.repository";
import {
  TopicSuggestion,
  suggestedTopicsRepository,
} from "../repositories/suggested-topics.repository";
import keyPhrasesService from "./key-phrases.service";

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
  const keyPhrasesScoreForNews = await Promise.all(
    newsArr.map(async (news) => ({
      news,
      keyPhraseScore: await keyPhrasesService.getKeyPhraseScores(
        news.content || news.title
      ),
    }))
  );
  const cleanedTopic = topic.toLowerCase().replace(/["']+/g, "");
  const filteredNewsArr = keyPhrasesScoreForNews
    .filter((e) => {
      return e.keyPhraseScore.some((keyPhrase) => {
        return (
          keyPhrase.text.toLowerCase().includes(cleanedTopic.toLowerCase()) &&
          keyPhrase.score > 0.85
        );
      });
    })
    .map((e) => e.news);
  const newsScores: Array<number> = await Promise.all(
    filteredNewsArr.map(async (news) =>
      sentimentAnalyzerService.analyzeText(news.title || news.content)
    )
  );
  const firstScore = newsScores.pop();
  const sampleAnalyzedArticles = filteredNewsArr;
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

async function getSuggestedTopic(): Promise<Array<TopicSuggestion>> {
  const data = await suggestedTopicsRepository.scan();
  return data;
}

export default {
  getTopicScore,
  getSuggestedTopic,
};
