/**
 * temporary and for debugging purposes only. should be moving to AWS SAM soon!
 */
import * as http from 'http';
import { logger } from './utils/logger.util';
import { NewsSourceRepository } from './repositories/news-sources.repository';
import express from 'express';

const app = express();
const port = 3001;

app.get('/:id', async (req, res) => {
  let sourceId = req.params.id;
  let newsSource = await NewsSourceRepository.get(sourceId);
  if (!newsSource) {
    return res.status(404).json({ message: `Cannot find resource with sourceId ${sourceId}.` });
  }
  return res.status(200).json(newsSource);
});

app.get('/', async (req, res) => {
  let sources = await NewsSourceRepository.scan();
  return res.status(200).json(sources);
});

app.listen(port, () => logger.info('Started server...'));