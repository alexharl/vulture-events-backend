import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import importRouter from './router/import.js';
import eventsRouter from './router/events.js';
import { initialize as initDB } from './db/index.js';

dotenv.config();
initDB(process.env.DB_PATH as string);

const app: Express = express();
app.use(cors({ origin: process.env.CORS_ORIGIN }));
const port = process.env.PORT;

app.use('/api/import', importRouter);
app.use('/api/events', eventsRouter);

app.listen(port, () => {
  console.log(`⚡️ [Server]: Server is running on port: ${port}`);
});
