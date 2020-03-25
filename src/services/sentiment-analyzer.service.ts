import comprehend from '../clients/comprehend.client';
import _ from 'lodash';
import { logger } from '../utils/logger.util';
import { BatchDetectSentimentItemResult } from 'aws-sdk/clients/comprehend';
import weakTrim from '../utils/weakTrim';

interface SentimentRequest {
  text: string;
  onDone: (result: number) => void;
  onError: (e: any) => void;
}

let batchBuffer: Array<SentimentRequest> = [];
let timeoutToken: ReturnType<typeof setTimeout> | undefined = undefined;
const WAIT_MS_BEFORE_SENDING = 1000;
const MAX_BATCH_BUFFER_SIZE = 25;
const COMPREHEND_QUOTA_PER_SECOND = 10;
const MAX_CHAR_LIMIT = 2000;

function computeScore(result: BatchDetectSentimentItemResult): number {
  const positive = _.get(result, 'SentimentScore.Positive');
  const negative = _.get(result, 'SentimentScore.Negative');
  const score = positive - negative;
  return score;
}

function clearTimeoutToken() {
  if (timeoutToken) {
    clearTimeout(timeoutToken);
    timeoutToken = undefined;
  }
}

async function dispatch() {
  clearTimeoutToken();
  let requestList = batchBuffer.slice(0, MAX_BATCH_BUFFER_SIZE);
  batchBuffer = batchBuffer.slice(MAX_BATCH_BUFFER_SIZE);
  function getRequestFromRequestList(index?: number): SentimentRequest {
    if (index === undefined) {
      throw new Error('wtf comprehend is this janky indexing');
    }
    let docRequest = requestList[index];
    if (!docRequest) {
      throw new Error('missing docRequest!');
    }
    return docRequest;
  }
  if (batchBuffer.length) {
    clearTimeoutToken();
    timeoutToken = setTimeout(() => dispatch(), 1000 / COMPREHEND_QUOTA_PER_SECOND);
  }
  if (!requestList.length) {
    logger.debug('Empty requestList. Skipping!');
    return;
  }
  try {
    const result = await comprehend.batchDetectSentiment({
      LanguageCode: 'en',
      TextList: requestList.map(e => e.text),
    }).promise();
    result.ResultList.forEach((e) => {
      let docRequest = getRequestFromRequestList(e.Index);
      let score = computeScore(e);
      if (!score) {
        throw new Error(`Unable to retrieve score from AWS Comprehend: ${JSON.stringify(result)}`);
      }
      docRequest.onDone(score);
    });
    result.ErrorList.forEach(e => {
      let docRequest = getRequestFromRequestList(e.Index);
      docRequest.onError(e);
    });
  } catch (e) {
    // it's a bad batch homie! let's get rid of em all
    logger.error(e);
    requestList.forEach(request => request.onError(e));
  }
}

async function sendForProcessing(sentimentRequest: SentimentRequest) {
  clearTimeoutToken();
  batchBuffer.push(sentimentRequest);
  if (timeoutToken === undefined) {
    timeoutToken = setTimeout(() => {
      dispatch();
    }, WAIT_MS_BEFORE_SENDING);
  }
}

async function analyzeText(text: string): Promise<number> {
  // logger.debug('Analysing text');
  const textToAnalyze = weakTrim(text, MAX_CHAR_LIMIT);
  return new Promise((res, rej) => {
    sendForProcessing({
      text: textToAnalyze,
      onDone: e => res(e),
      onError: err => rej(err),
    });
  });
}

export default { analyzeText };