import comprehend from "../clients/comprehend.client";
import _ from "lodash";
import { BatchDetectSentimentItemResult } from "aws-sdk/clients/comprehend";
import weakTrim from "../utils/weakTrim";
import BufferedService, { BufferedRequest } from "../utils/BufferedService";

const WAIT_MS_BEFORE_SENDING = 100;
const MAX_BATCH_BUFFER_SIZE = 25;
const COMPREHEND_QUOTA_PER_SECOND = 10;
const MAX_CHAR_LIMIT = 2000;

function computeScore(result: BatchDetectSentimentItemResult): number {
  const positive = _.get(result, "SentimentScore.Positive");
  const negative = _.get(result, "SentimentScore.Negative");
  const score = positive - negative;
  return score;
}

class SentimentAnalyzerService extends BufferedService<string, number> {
  constructor() {
    super(
      MAX_BATCH_BUFFER_SIZE,
      WAIT_MS_BEFORE_SENDING,
      COMPREHEND_QUOTA_PER_SECOND
    );
  }
  async processRequest(requestList: BufferedRequest<string, number>[]) {
    const result = await comprehend
      .batchDetectSentiment({
        LanguageCode: "en",
        TextList: requestList.map((e) => e.data),
      })
      .promise();
    result.ResultList.forEach((e) => {
      const docRequest = this.getRequestFromRequestList(requestList, e.Index);
      const score = computeScore(e);
      if (!score) {
        throw new Error(
          `Unable to retrieve score from AWS Comprehend: ${JSON.stringify(
            result
          )}`
        );
      }
      docRequest.onDone(score);
    });
    result.ErrorList.forEach((e) => {
      const docRequest = this.getRequestFromRequestList(requestList, e.Index);
      docRequest.onError(e);
    });
  }

  async analyzeText(text: string): Promise<number> {
    const textToAnalyze = weakTrim(text, MAX_CHAR_LIMIT);
    return new Promise((res, rej) => {
      this.sendForProcessing({
        data: textToAnalyze,
        onDone: res,
        onError: rej,
      });
    });
  }
}

const sentimentAnalyzerService = new SentimentAnalyzerService();

export default sentimentAnalyzerService;
