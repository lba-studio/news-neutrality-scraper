import { NewsService } from "../services/news";
import NewsRssService from "../services/news/news-rss.service";
import { Subscriber } from "rxjs";

async function rssNewsServiceLoader(subscriber: Subscriber<NewsService>) {
  const rssFeeds: Array<{ sourceName: string, sourceUrl: string, sourceCountry: string, sourceId: string }> = [
    {
      sourceUrl: 'http://www.sbs.com.au/news/rss/Section/Top+Stories',
      sourceName: 'SBS',
      sourceId: 'sbs-au',
      sourceCountry: 'au',
    },
    {
      sourceUrl: 'http://www.9news.com.au/rss',
      sourceName: '9News',
      sourceId: '9news-au',
      sourceCountry: 'au',
    },
    {
      sourceName: 'news.com.au',
      sourceCountry: 'au',
      sourceId: 'news.com.au-au',
      sourceUrl: 'https://www.news.com.au/content-feeds/latest-news-national/'
    },
    {
      sourceName: 'Sydney Morning Herald (SMH)',
      sourceCountry: 'au',
      sourceUrl: 'https://www.smh.com.au/rss/feed.xml',
      sourceId: 'smh-au',
    },
    {
      sourceName: 'The Age',
      sourceCountry: 'au',
      sourceUrl: 'https://www.theage.com.au/rss/feed.xml',
      sourceId: 'theage-au',
    },
    {
      sourceName: 'Herald Sun',
      sourceCountry: 'au',
      sourceUrl: 'http://www.heraldsun.com.au/news/breaking-news/rss',
      sourceId: 'heraldsun-au'
    },
  ];
  rssFeeds.forEach(rssFeed => subscriber.next(new NewsRssService(rssFeed.sourceUrl, rssFeed.sourceName, rssFeed.sourceCountry, rssFeed.sourceId)));
}

export default rssNewsServiceLoader;