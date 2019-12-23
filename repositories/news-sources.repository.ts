import { CreateTableInput } from 'aws-sdk/clients/dynamodb';
import { dynamoDbDocClient } from '../clients/dynamodb.client';
import config from '../config';

export interface NewsSource {
  id: string;
  score: number;
  url: string;
};

const TABLE_NAME = config.db.tableNames.newsSources;

export const NewsSourceRepository = {
  get: async (id: string, consistentRead: boolean = false): Promise<NewsSource> => {
    return dynamoDbDocClient.get({
      TableName: TABLE_NAME,
      Key: {
        id: id,
      },
      ConsistentRead: consistentRead
    }).promise()
    .then(item => item.Item as NewsSource)
  },
  put: async (newsSource: NewsSource) => {
    return dynamoDbDocClient.put({ TableName: TABLE_NAME, Item: newsSource }).promise();
  },
};