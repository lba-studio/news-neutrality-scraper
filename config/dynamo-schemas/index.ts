import { CreateTableInput } from "aws-sdk/clients/dynamodb";
import config from "..";
import newsSourcesSchema from './news-sources.schema.json';

export const NewsSourcesSchema: CreateTableInput = newsSourcesSchema;