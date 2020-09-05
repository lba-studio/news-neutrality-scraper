import {
  NewsSourcesSchema,
  TopicScoreSchema,
  SuggestedTopicSchema,
} from "./config/dynamo-schemas";
import { logger } from "./utils/logger.util";
import { baseDynamoDbClient } from "./clients/dynamodb.client";
import { CreateTableInput } from "aws-sdk/clients/dynamodb";
import {
  suggestedTopicsRepository,
  TopicSuggestion,
} from "./repositories/suggested-topics.repository";

async function createTable(input: CreateTableInput) {
  await baseDynamoDbClient
    .createTable(input)
    .promise()
    .catch((e) => {
      if (e.code === "ResourceInUseException") {
        logger.info(`Table ${input.TableName} already exists. Skipping.`);
        // logger.debug(e);
      } else {
        throw e;
      }
    });
}

async function initDynamoDb() {
  logger.info("Initialising DynamoDB table...");
  await Promise.all([
    createTable(NewsSourcesSchema),
    createTable(TopicScoreSchema),
    createTable(SuggestedTopicSchema),
  ]);
}

async function seedData() {
  const data: Array<TopicSuggestion> = [
    {
      topic: "Coronavirus",
      imgUrl:
        "https://www.nationalgeographic.com/content/dam/science/2020/03/13/coronavirus_og/01_coronavirus_cdc_2871.adapt.1900.1.jpg",
    },
    {
      topic: "Joe Biden",
      imgUrl:
        "https://static.politico.com/dims4/default/22f65e1/2147483647/resize/1160x%3E/quality/90/?url=https%3A%2F%2Fstatic.politico.com%2Fb9%2Fc3%2F54a99abc4bd5832dea2d4cb25ffb%2Fgettyimages-1256156642-773.jpg",
    },
    {
      topic: "Donald Trump",
      imgUrl:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Donald_Trump_official_portrait.jpg/1200px-Donald_Trump_official_portrait.jpg",
    },
  ];
  await Promise.all(data.map((e) => suggestedTopicsRepository.put(e)));
}

async function main() {
  logger.info("Init DynamoDB...");
  await initDynamoDb();
  logger.info("Seeding DynamoDB...");
  await seedData();
  logger.info("Init done!");
}
if (!module.parent) {
  main()
    .then(() => logger.info("Initialization completed."))
    .catch((e) => {
      logger.error(e);
      process.exit(1);
    });
}

export const handler = main;
