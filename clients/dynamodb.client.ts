import AWS from 'aws-sdk';
import config from '../config';
import { logger } from '../utils/logger.util';

let options: AWS.DynamoDB.Types.ClientConfiguration = {};
let localEndpoint: string | undefined = config.db.localEndpoint;
if (localEndpoint) {
    logger.debug(`Using ${localEndpoint} for DynamoDB.`);
    options.endpoint = localEndpoint;
}
export const dynamoDbDocClient: AWS.DynamoDB.DocumentClient = new AWS.DynamoDB.DocumentClient(options);

export const baseDynamoDbClient = new AWS.DynamoDB(options);