import { APIGatewayProxyHandler } from "aws-lambda";
import { NewsSourceRepository } from "../repositories/news-sources.repository";
import { handleError, injectCors } from "../helpers/lambda.helper";

export const getNews: APIGatewayProxyHandler = injectCors(handleError(async () => {
  const results = await NewsSourceRepository.scan();
  return {
    statusCode: 200,
    body: JSON.stringify(results),
  };
}));

export const getNewsById: APIGatewayProxyHandler = async (event) => {
  if (!event.pathParameters || !event.pathParameters.id) {
    throw new Error('Path parameter missing.');
  }
  const newsSourceId = event.pathParameters.id;
  const result = await NewsSourceRepository.get(newsSourceId);
  if (!result) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        message: `Cannot find news with ID ${newsSourceId}.`
      })
    }
  }
  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
}