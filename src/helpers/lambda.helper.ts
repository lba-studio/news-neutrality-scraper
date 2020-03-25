import { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";
import { logger } from "../utils/logger.util";

function checkIfResultIsEmpty(result: void | APIGatewayProxyResult): APIGatewayProxyResult {
  if (!result) {
    throw new Error('Fatal implementation error: Empty result.');
  }
  return result;
}

export function handleError(func: APIGatewayProxyHandler): APIGatewayProxyHandler {
  return async (...args): Promise<APIGatewayProxyResult> => {
    try {
      const result = checkIfResultIsEmpty(await func(...args));
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

export function injectCors(func: APIGatewayProxyHandler): APIGatewayProxyHandler {
  return async (...args): Promise<APIGatewayProxyResult> => {
    const result = checkIfResultIsEmpty(await func(...args));
    return {
      ...result,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    }
  }
}

export function defaultApiResponseHandler(func: Function, statusCode?: number): APIGatewayProxyHandler {
  return handleError(injectCors(async () => {
    const result = await func();
    if (!result) {
      return {
        body: '',
        statusCode: statusCode || 204,
      }
    } else {
      return {
        body: JSON.stringify(result),
        statusCode: statusCode || 200,
      }
    }
  }));
}