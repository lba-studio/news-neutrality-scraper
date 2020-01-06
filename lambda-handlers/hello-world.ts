import { APIGatewayProxyResult } from "aws-lambda";
import { logger } from '../utils/logger.util';

export async function helloWorld(): Promise<APIGatewayProxyResult> {
  return {
    body: 'Hiya world!',
    statusCode: 200,
  };
}