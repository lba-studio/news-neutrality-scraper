import { CreateTableInput } from "aws-sdk/clients/dynamodb";
import config from "..";

export const NewsSourcesSchema: CreateTableInput = {
  "TableName": config.db.tableNames.newsSources,
  "KeySchema": [
      {
          "AttributeName": "id",
          "KeyType": "HASH"
      },
  ],
  "AttributeDefinitions": [
      {
          "AttributeName": "id",
          "AttributeType": "S"
      },
  ],
  "ProvisionedThroughput": {
      "ReadCapacityUnits": 5,
      "WriteCapacityUnits": 5
  }
};