import { CreateTableInput } from "aws-sdk/clients/dynamodb";
import newsSourcesSchema from './news-sources.schema.json';

export const NewsSourcesSchema: CreateTableInput = newsSourcesSchema;