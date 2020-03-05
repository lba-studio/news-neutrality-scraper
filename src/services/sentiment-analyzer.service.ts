import * as natural from 'natural';

export async function analyzeText(text: string): Promise<number> {
  if (!text) {
    throw new Error('Unable to analyse null-texts!');
  }
  let tokenizedText: Array<string> = await tokenizeText(text);
  let analyzer = new natural.SentimentAnalyzer('English', null, 'afinn');
  return analyzer.getSentiment(tokenizedText);
}

async function tokenizeText(text: string): Promise<Array<string>> {
  let tokenizer = new natural.WordTokenizer();
  return tokenizer.tokenize(text);
}