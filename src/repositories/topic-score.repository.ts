import { dynamoDbDocClient } from "../clients/dynamodb.client";
import { config } from "../config";

export interface TopicScore {
  score: number;
  topic: string;
}

const TABLE_NAME = config.db.tableNames.topicScore;

const topicScoreRepository = {
  put: async (topicScore: TopicScore, ttlSeconds = 86400 * 5) => {
    const itemToPut = {
      ...topicScore,
      ttl: Math.floor(Date.now() / 1000) + ttlSeconds,
    }
    return await dynamoDbDocClient.put({
      TableName: TABLE_NAME, 
      Item: itemToPut,
    }).promise();
  },
  scan: async (): Promise<Array<TopicScore>> => {
    return dynamoDbDocClient.scan({ TableName: TABLE_NAME }).promise()
      .then(item => item.Items as Array<TopicScore>);
  },
  get: async (topic: string, consistentRead = false): Promise<TopicScore | undefined> => {
    return dynamoDbDocClient.get({
      TableName: TABLE_NAME,
      Key: {
        topic: topic,
      },
      ConsistentRead: consistentRead
    }).promise()
      .then(item => item.Item as TopicScore);
  },
};

export default topicScoreRepository;