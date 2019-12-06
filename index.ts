import { analyzeText } from "./services/sentiment-analyzer.service";
import puppeteer from 'puppeteer';
import cheerio from 'cheerio';

const keywords = [
  'commonwealth',
  'bank',
  'commonwealth bank',
  'commbank'
];

function extractLinksToExplore(htmlContent: string): Array<string> {
  let $ = cheerio.load(htmlContent);
  return $('article').find('a')
    .toArray()
    .map(e => $(e).attr('href'));
}

function containsNeededKeyword(text: string, keywordsToLookFor: Array<string>) {
  return keywordsToLookFor.some(keyword => text.includes(keyword));
}

async function retrieveMainTextFromArticleLink(puppeteerInstance: puppeteer.Browser, href: string): Promise<string | undefined> {
  console.debug(`Retrieving href ${href}`);
  if (href.match(/.*\/news\/programs\/.*/)) {
    return undefined;
  }
  let page = await puppeteerInstance.newPage();
  await page.goto(href);
  let mainText: string = '';
  await page.content().then(content => {
    let $ = cheerio.load(content);
    $('div.article.section').children()
      .toArray()
      .map(e => {
        mainText += `${$(e).text()}\n`;
      });
  });
  console.debug(`Finished retrieval of href ${href}`);
  // console.log(mainText);
  mainText = mainText.toLowerCase();
  if (!containsNeededKeyword(mainText, keywords)) {
    console.debug(`href ${href} does not contain needed keywords. Skipping!`);
    return undefined;
  }
  await page.close();
  return mainText;
}

async function handler() {
  const maxPage = 100;
  let pageNumber = 1; // starts at 1 lol
  // analyzeText();
  let puppeteerInstance: puppeteer.Browser = await puppeteer.launch();
  let page = await puppeteerInstance.newPage();
  let avgScore: number | undefined = undefined;
  while (pageNumber <= maxPage) {
    let pages = await puppeteerInstance.pages();
    console.debug(`Total pages: ${pages.length}`)
    console.debug(`Loading search page number ${pageNumber}.`);
    let content: string = await loadSearchResultsContent(page, pageNumber);
    let linksToExplore: Array<string> = extractLinksToExplore(content);
    console.log('Extracted the following links:', linksToExplore);
    // await retrieveMainTextFromArticleLink(puppeteerInstance, linksToExplore[0]);
    let scoreResults: Array<number | undefined> = await Promise.all(linksToExplore.map(link => retrieveMainTextFromArticleLink(puppeteerInstance, link)
      .then(mainText => mainText ? analyzeText(mainText) : undefined)
    ));
    let filteredScoreResults: Array<number> = scoreResults.filter(result => result !== undefined) as Array<number>;
    console.log(`${filteredScoreResults.length} texts analyzed!`);
    if (filteredScoreResults.length !== 0) {
      if (avgScore === undefined) {
        avgScore = filteredScoreResults.pop();
      }
      let avgScoreForArticle = filteredScoreResults.reduce((acc, currentValue) => (acc + currentValue) / 2);
      avgScore = ((avgScore as number) + avgScoreForArticle) / 2;
    }
    console.log(avgScore);
    pageNumber += 1;
  }
  puppeteerInstance.close();
}

async function loadSearchResultsContent(page: puppeteer.Page, pageNumber: number): Promise<string> {
  const url = `https://search-beta.abc.net.au/#/?query=commonwealth%20bank&page=${pageNumber}&configure%5BgetRankingInfo%5D=true&sortBy=ABC_production_all_latest&refinementList%5Bsite.title%5D%5B0%5D=ABC%20News`;
  await page.goto(url, { waitUntil: 'networkidle0' });
  return await page.content();
}

handler().then(() => console.log('Finished!'));
