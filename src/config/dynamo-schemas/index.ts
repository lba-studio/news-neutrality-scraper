import { CreateTableInput } from "aws-sdk/clients/dynamodb";
import newsSourcesSchema from "./news-sources.schema.json";
import topicScoreSchema from "./topic-score.schema.json";
import suggestedTopicSchema from "./suggested-topic.schema.json";

export const NewsSourcesSchema: CreateTableInput = newsSourcesSchema;
export const TopicScoreSchema: CreateTableInput = topicScoreSchema;
export const SuggestedTopicSchema: CreateTableInput = suggestedTopicSchema;
