import { NewsSourcesSchema } from "./config/dynamo-schemas";
import { logger } from "./utils/logger.util";
import { baseDynamoDbClient } from "./clients/dynamodb.client";
import { CreateTableInput } from "aws-sdk/clients/dynamodb";

async function createTable(input: CreateTableInput) {
  await baseDynamoDbClient.createTable(input).promise()
    .catch(e => {
      if (e.code === 'ResourceInUseException') {
        logger.info(`Table ${input.TableName} already exists. Skipping.`)
        logger.debug(e);
      } else {
        throw e;
      }
    });
}

async function initDynamoDb() {
  logger.info('Initialising DynamoDB table...');
  await createTable(NewsSourcesSchema);
}

async function main() {
  await initDynamoDb();
  logger.info('Init done!');
}

main()
  .then(() => logger.info('Initialization completed.'))
  .catch(e => {
    logger.error(e);
    process.exit(1);
  });