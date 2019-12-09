import { analyzeText } from "./services/sentiment-analyzer.service";
import { AbcNewsService } from "./services/news/abcnews.service";
import { News } from "./services/news/news.service";

const keywords = [
  'commonwealth',
  'bank',
  'commonwealth bank',
  'commbank'
];

async function handler() {
  let avgScore: number | undefined = undefined;
  let counter = 0;
  await AbcNewsService.getNewsObservable().forEach((news: News) => {
    let score = analyzeText(news.content);
    if (avgScore === undefined) {
      avgScore = score;
    } else {
      avgScore = (avgScore + score) / 2;
    }
    console.log(`${counter} texts analyzed! Avg score: ${avgScore}`);
    counter += 1;
  });
}

handler().then(() => console.log('Finished!'));
