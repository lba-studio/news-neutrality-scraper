import { OnlineNewsArticle } from "./news";
import sentimentAnalyzerService from "./sentiment-analyzer.service";
import newsApiService from "./news/newsapi.service";
import topicScoreRepository from "../repositories/topic-score.repository";

export type GetTopicResult = {
  score: number | null;
  newsArticlesAnalyzed: number;
  sampleAnalyzedArticles: Array<OnlineNewsArticle>;
};

export interface TopicSuggestion {
  topic: string;
  imgUrl: string;
}

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

async function getSuggestedTopic(): Promise<Array<TopicSuggestion>> {
  const data: Array<TopicSuggestion> = [
    {
      topic: "Coronavirus",
      imgUrl:
        "https://www.nationalgeographic.com/content/dam/science/2020/03/13/coronavirus_og/01_coronavirus_cdc_2871.adapt.1900.1.jpg",
    },
    {
      topic: "Joe Biden",
      imgUrl:
        "https://static.politico.com/dims4/default/22f65e1/2147483647/resize/1160x%3E/quality/90/?url=https%3A%2F%2Fstatic.politico.com%2Fb9%2Fc3%2F54a99abc4bd5832dea2d4cb25ffb%2Fgettyimages-1256156642-773.jpg",
    },
    {
      topic: "Donald Trump",
      imgUrl:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Donald_Trump_official_portrait.jpg/1200px-Donald_Trump_official_portrait.jpg",
    },
  ];
  return data;
}

export default {
  getTopicScore,
  getSuggestedTopic,
};
