import Parser from 'rss-parser';
import { NewsService, News } from '.';
import { Observable } from 'rxjs';
import axios from 'axios';
import htmlToText from 'html-to-text';

const parser = new Parser();

class NewsRssService implements NewsService {
  readonly sourceId: string;
  constructor(
    readonly sourceUrl: string,
    readonly sourceName: string,
    readonly sourceCountry: string,
  ) {
    this.sourceId = `rss-${this.sourceUrl.replace(/^https?:\/\//, '')}`; // prettified really
  }

  getNewsObservable() {
    return new Observable<News>(subscriber => {
      (async () => {
        let data = await axios.get(this.sourceUrl).then(e => e.data);
        let feed = await parser.parseString(data);
        if (!feed.items) {
          throw new Error('RSS - Empty items!');
        }
        feed.items.forEach(item => {
          let dirtyContent: string | undefined = item['content:encoded'] || item.contentSnippet || item.content;
          console.log(dirtyContent);
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