import { NewsService } from "../services/news";
import NewsRssService from "../services/news/news-rss.service";
import { Subscriber } from "rxjs";

interface RssFeedInfo {
  sourceName: string;
  sourceUrl: string;
  sourceCountry: string;
  sourceId: string;
  rssFeedUrl: string;
}

async function rssNewsServiceLoader(subscriber: Subscriber<NewsService>) {
  const rssFeeds: Array<RssFeedInfo> = [
    {
      rssFeedUrl: "http://www.sbs.com.au/news/rss/Section/Top+Stories",
      sourceName: "SBS",
      sourceId: "sbs-au",
      sourceCountry: "au",
      sourceUrl: "http://www.sbs.com.au",
    },
    {
      rssFeedUrl: "http://www.9news.com.au/rss",
      sourceName: "9News",
      sourceId: "9news-au",
      sourceCountry: "au",
      sourceUrl: "http://www.9news.com.au",
    },
    {
      sourceUrl: "https://news.com.au",
      sourceName: "news.com.au",
      sourceCountry: "au",
      sourceId: "news.com.au-au",
      rssFeedUrl: "https://www.news.com.au/content-feeds/latest-news-national/",
    },
    {
      sourceName: "Sydney Morning Herald (SMH)",
      sourceCountry: "au",
      rssFeedUrl: "https://www.smh.com.au/rss/feed.xml",
      sourceId: "smh-au",
      sourceUrl: "https://www.smh.com.au",
    },
    {
      sourceUrl: "https://www.theage.com.au",
      sourceName: "The Age",
      sourceCountry: "au",
      rssFeedUrl: "https://www.theage.com.au/rss/feed.xml",
      sourceId: "theage-au",
    },
    {
      sourceUrl: "http://www.heraldsun.com.au",
      sourceName: "Herald Sun",
      sourceCountry: "au",
      rssFeedUrl: "http://www.heraldsun.com.au/news/breaking-news/rss",
      sourceId: "heraldsun-au",
    },
  ];
  rssFeeds.forEach((rssFeed) =>
    subscriber.next(
      new NewsRssService(
        rssFeed.rssFeedUrl,
        rssFeed.sourceName,
        rssFeed.sourceCountry,
        rssFeed.sourceId,
        rssFeed.sourceUrl
      )
    )
  );
}

export default rssNewsServiceLoader;
