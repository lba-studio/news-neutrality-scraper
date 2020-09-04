import { defaultApiResponseHandler } from "../helpers/lambda.helper";
import topicService from "../services/topic.service";

export const handler = defaultApiResponseHandler(
  topicService.getSuggestedTopic,
  200
);
