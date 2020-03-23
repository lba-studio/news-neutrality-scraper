import { NewsService } from "../services/news";
import NewsRssService from "../services/news/news-rss.service";
import { Subscriber } from "rxjs";

async function rssNewsServiceLoader(subscriber: Subscriber<NewsService>) {
  const rssFeeds: Array<{ sourceName: string, sourceUrl: string, sourceCountry: string }> = [
    {
      sourceUrl: 'http://www.sbs.com.au/news/rss/Section/Top+Stories',
      sourceName: 'SBS',
      sourceCountry: 'au',
    },
    {
      sourceUrl: 'http://www.9news.com.au/rss',
      sourceName: '9News',
      sourceCountry: 'au',
    }
  ];
  rssFeeds.forEach(rssFeed => subscriber.next(new NewsRssService(rssFeed.sourceUrl, rssFeed.sourceName, rssFeed.sourceCountry)));
}

export default rssNewsServiceLoader;