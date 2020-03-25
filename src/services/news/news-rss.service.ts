import Parser from 'rss-parser';
import { NewsService, News } from '.';
import { Observable } from 'rxjs';
import axios from 'axios';
import htmlToText from 'html-to-text';

const parser = new Parser();

class NewsRssService implements NewsService {
  constructor(
    readonly sourceUrl: string,
    readonly sourceName: string,
    readonly sourceCountry: string,
    readonly sourceId: string,
    private maxItems: number = 50,
  ) { }

  getNewsObservable() {
    return new Observable<News>(subscriber => {
      (async () => {
        let data = await axios.get(this.sourceUrl).then(e => e.data);
        let feed = await parser.parseString(data);
        if (!feed.items) {
          throw new Error('RSS - Empty items!');
        }
        let items = feed.items;
        if (this.maxItems) {
          items = items.slice(0, this.maxItems);
        }
        items.forEach(item => {
          let dirtyContent: string | undefined = item['content:encoded'] || item.contentSnippet || item.content;
          let title = item.title;
          if (!dirtyContent || !title) {
            throw new Error('RSS - Empty content and/or title.');
          }
          let content: string = htmlToText.fromString(dirtyContent, {
            wordwrap: false,
            ignoreHref: true,
            ignoreImage: true,
            noLinkBrackets: true,
            uppercaseHeadings: false,
            singleNewLineParagraphs: true,
          });
          subscriber.next({
            title: title,
            content: content,
          });
        });
      })().then(() => subscriber.complete())
        .catch(e => subscriber.error(e));
    });
  }
}

export default NewsRssService;