import { dynamoDbDocClient } from '../clients/dynamodb.client';
import { config } from '../config';

export interface NewsSourceScore {
  id: string;
  score: number;
  url: string;
  retrievedFrom?: string; // e.g. "https://newsapi.org"
  name: string;
  country: string;
  lastUpdatedMs: number;
}

const TABLE_NAME = config.db.tableNames.newsSources;

export const NewsSourceRepository = {
  get: async (id: string, consistentRead = false): Promise<NewsSourceScore | undefined> => {
    return dynamoDbDocClient.get({
      TableName: TABLE_NAME,
      Key: {
        id: id,
      },
      ConsistentRead: consistentRead
    }).promise()
      .then(item => item.Item as NewsSourceScore)
  },
  put: async (newsSource: NewsSourceScore) => {
    return dynamoDbDocClient.put({ TableName: TABLE_NAME, Item: newsSource }).promise();
  },
  scan: async (): Promise<Array<NewsSourceScore>> => {
    return dynamoDbDocClient.scan({ TableName: TABLE_NAME }).promise()
      .then(item => item.Items as Array<NewsSourceScore>);
  }
};