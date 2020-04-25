import { defaultApiResponseHandler } from "../helpers/lambda.helper";
import { APIGatewayProxyEvent } from "aws-lambda";
import { BadRequestError } from "../errors";
import topicScoreRepository from "../repositories/topic-score.repository";

export const getAllTopicScoresHandler = defaultApiResponseHandler(async () =>
  topicScoreRepository.scan());

async function getTopicScore(event: APIGatewayProxyEvent) {
  const topic = event.pathParameters?.topic;
  if (!topic) {
    throw new BadRequestError('Path parameter topic must be provided.');
  }
  return await topicScoreRepository.get(topic);
}
export const getTopicScoreHandler = defaultApiResponseHandler(getTopicScore);