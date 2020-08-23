import { APIGatewayProxyEvent } from "aws-lambda";
import { defaultApiResponseHandler, getBody } from "../helpers/lambda.helper";
import { BadRequestError } from "../errors";
import topicService from "../services/topic.service";

async function searchTopic(event: APIGatewayProxyEvent) {
  const topic: string | undefined = getBody(event).topic;
  if (!topic) {
    throw new BadRequestError("Query parameter topic must be provided.");
  }
  const topicScoreResult = await topicService.getTopicScore(topic);
  return topicScoreResult;
}

export const handler = defaultApiResponseHandler(searchTopic, 200);
