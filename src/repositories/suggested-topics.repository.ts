import { dynamoDbDocClient } from "../clients/dynamodb.client";
import { config } from "../config";

export interface TopicSuggestion {
  topic: string;
  imgUrl: string;
}

const TABLE_NAME = config.db.tableNames.suggestedTopic;

export const suggestedTopicsRepository = {
  put: async (topicSuggestion: TopicSuggestion) => {
    return dynamoDbDocClient
      .put({ TableName: TABLE_NAME, Item: topicSuggestion })
      .promise();
  },
  scan: async (): Promise<Array<TopicSuggestion>> => {
    return dynamoDbDocClient
      .scan({ TableName: TABLE_NAME })
      .promise()
      .then((item) => item.Items as Array<TopicSuggestion>);
  },
};
