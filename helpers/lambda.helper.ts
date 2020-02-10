import { APIGatewayProxyHandler, APIGatewayProxyResult, APIGatewayProxyEvent, Context, Callback } from "aws-lambda";
import { logger } from "../utils/logger.util";

export function handleError(func: APIGatewayProxyHandler): APIGatewayProxyHandler {
  return async (...args) => {
    try {
      const result = await func(...args);
      if (!result) {
        throw new Error('Fatal implementation error: Empty result.');
      }
      return result;
    } catch (e) {
      let errorObject = (e instanceof Error) ? {
          error: e.message,
          errorType: e.name,
          stack: e.stack,
        } : e;
      logger.error(e);
      return {
        statusCode: 500,
        body: JSON.stringify(errorObject),
      };
    }
  };
}