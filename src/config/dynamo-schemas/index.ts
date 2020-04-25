import { CreateTableInput } from "aws-sdk/clients/dynamodb";
import newsSourcesSchema from './news-sources.schema.json';
import topicScoreSchema from './topic-score.schema.json';

export const NewsSourcesSchema: CreateTableInput = newsSourcesSchema;
export const TopicScoreSchema: CreateTableInput = topicScoreSchema;