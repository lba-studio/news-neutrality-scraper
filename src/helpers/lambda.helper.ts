import { APIGatewayProxyHandler, APIGatewayProxyResult, APIGatewayProxyEvent } from "aws-lambda";
import { logger } from "../utils/logger.util";
import { BadRequestError } from "../errors";

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
      let statusCode = 500;
      if (e instanceof BadRequestError) {
        statusCode = 400;
      }
      return {
        statusCode: statusCode,
        body: JSON.stringify(errorObject),
      };
    }
  };
}

export function getBody(event: APIGatewayProxyEvent): any {
  if (!event.body) {
    throw new BadRequestError('Unable to get required payload body.');
  }
  return JSON.parse(event.body);
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

export function defaultApiResponseHandler(func: APIGatewayProxyHandler | Function, statusCode?: number): APIGatewayProxyHandler {
  return handleError(injectCors(async (...args) => {
    const result = await func(...args);
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