import * as natural from 'natural';

export function analyzeText(text: string): number {
  let tokenizedText: Array<string> = tokenizeText(text);
  let analyzer = new natural.SentimentAnalyzer('English', null, 'afinn');
  return analyzer.getSentiment(tokenizedText);
}

export function tokenizeText(text: string): Array<string> {
  let tokenizer = new natural.WordTokenizer();
  return tokenizer.tokenize(text);
}