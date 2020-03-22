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
    this.sourceId = `rss-${this.sourceUrl.replace(/^https?:\/\//, '')}`;
  }

  getNewsObservable() {
    return new Observable<News>(subscriber => {
      (async () => {
        let data = await axios.get(this.sourceUrl).then(e => e.data);
        let feed = await parser.parseString(data);
        feed.items?.forEach(item => {
          let contentEncoded: string | undefined = htmlToText.fromString(item['content:encoded'], {
            wordwrap: false,
            ignoreHref: true,
            ignoreImage: true,
            noLinkBrackets: true,
            uppercaseHeadings: false,
            singleNewLineParagraphs: true,
          });
          let content: string | undefined = contentEncoded || item.contentSnippet || item.content;
          let title = item.title;
          if (!content || !title) {
            throw new Error('RSS - Empty content and/or title.');
          }
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