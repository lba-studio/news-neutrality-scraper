import sentimentAnalyzerService from "./sentiment-analyzer.service";
import { expect } from 'chai';
import aws from 'aws-sdk';
import comprehend from '../clients/comprehend.client'
import sinon from 'sinon';
import { BatchDetectSentimentResponse, BatchDetectSentimentItemResult, ListOfDetectSentimentResult, BatchDetectSentimentRequest } from "aws-sdk/clients/comprehend";
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import mockAsync from "../utils/mockAsync";

chai.use(chaiAsPromised);

type AWSBatchDetectSentimentRequest = aws.Request<aws.Comprehend.BatchDetectSentimentResponse, aws.AWSError>;

function generateResultList(texts: Array<string>): ListOfDetectSentimentResult {
  return texts.map<BatchDetectSentimentItemResult>((e, index) => {
    return {
      Index: index,
      SentimentScore: {
        // keep in mind we don't validate what comprehend returns here, so it's all g if we be a bit wack
        Positive: e.length,
        Negative: 0,
      }
    }
  });
}

function generateTextList(desiredLength: number): Array<string> {
  const output: Array<string> = [];
  for (let i = 0; i < desiredLength; i++) {
    output.push('1'.padStart(i + 1, '1'));
  }
  return output;
}

describe("sentiment-analyzer.service", () => {
  beforeEach(() => {
    sinon.restore();
  });

  it('should analyse text successfully', async () => {
    const input = 'I hate this project.';
    sinon.stub(comprehend, 'batchDetectSentiment').returns({
      promise: () => Promise.resolve<BatchDetectSentimentResponse>({
        ResultList: [
          {
            Index: 0,
            SentimentScore: {
              Negative: 0.60,
              Positive: 0.40,
              Neutral: 0,
            }
          }
        ],
        ErrorList: [],
      })
    } as AWSBatchDetectSentimentRequest);
    const score = await sentimentAnalyzerService.analyzeText(input);
    expect(score).to.not.be.undefined;
    expect(score).to.equal(0.4 - 0.6);
  });

  it('should throw appropriate errors when resultlist indexes are messed up', async () => {
    const input = 'I hate this project.';
    sinon.stub(comprehend, 'batchDetectSentiment').returns({
      promise: () => Promise.resolve<BatchDetectSentimentResponse>({
        ResultList: [
          {
            Index: 12314124123,
            SentimentScore: {
              Negative: 0.60,
              Positive: 0.40,
              Neutral: 0,
            }
          }
        ],
        ErrorList: [],
      })
    } as AWSBatchDetectSentimentRequest);
    expect(sentimentAnalyzerService.analyzeText(input)).to.eventually.be.rejected;
  });

  it('should be able to handle large volumes of texts (25+)', async () => {
    const inputs = generateTextList(1001);
    sinon.stub(comprehend, 'batchDetectSentiment').callsFake(((params: BatchDetectSentimentRequest) => {
      return {
        promise: () => mockAsync<BatchDetectSentimentResponse>({
          ResultList: generateResultList(params.TextList),
          ErrorList: [],
        }, 1000)
      } as AWSBatchDetectSentimentRequest;
    }) as any);
    await Promise.all(inputs.map(async input => {
      const score = await sentimentAnalyzerService.analyzeText(input);
      expect(score).to.equal(input.length);
    }));
  }).timeout(60000);
});