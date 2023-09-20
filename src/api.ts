import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import dayjs from 'dayjs';
dayjs.locale('de');
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
dayjs.extend(customParseFormat);

import { ActionResponse } from './model/actionResponse.js';
import { performImport } from './import/zbau.js';

import { initialize as initDB, filterEvents, getEventById } from './db/index.js';
import { IEventQuery } from './model/db.js';

dotenv.config();

const app: Express = express();
app.use(cors({ origin: process.env.CORS_ORIGIN }));
const port = process.env.PORT;

initDB(process.env.DB_PATH as string);

app.post('/api/import/zbau', async (req: Request, res: Response) => {
  console.log('🟢 [API] Importing ZBAU events');
  try {
    const importResponse = await performImport();
    res.send(importResponse);
  } catch (e: any) {
    console.log('⭕️ [API] Import failed:', e.message);
    res.status(500).send(ActionResponse.Error('Server error'));
  }
});

app.get('/api/events/:id', async (req: Request, res: Response) => {
  console.log(`🟢 [API] Get event by id '${req.params.id}'`);
  try {
    const event = await getEventById(req.params.id);
    if (!event) {
      res.status(404).send(ActionResponse.Error('Event not found'));
    } else {
      res.send(event);
    }
  } catch (e: any) {
    console.log('⭕️ [API] Get event by id failed:', e.message);
    res.status(500).send(ActionResponse.Error('Server error'));
  }
});

app.get('/api/events', async (req: Request, res: Response) => {
  console.log('🟢 [API] Filter events');
  try {
    // build filter query from request query
    const query: IEventQuery = {
      nextWeekend: req.query.nextWeekend === '1'
    };

    if (req.query.categories?.length && typeof req.query.categories === 'string') {
      query.categories = req.query.categories.split(',');
    }
    if (req.query.text?.length && typeof req.query.text === 'string') {
      query.text = req.query.text;
    }
    if (req.query.origin?.length && typeof req.query.origin === 'string') {
      query.origin = req.query.origin;
    }

    const filteredEventsResponse = filterEvents(query);
    res.send(filteredEventsResponse);
  } catch (e: any) {
    console.log('⭕️ [API] Filter events failed:', e.message);
    res.status(500).send(ActionResponse.Error('Server error'));
  }
});

app.listen(port, () => {
  console.log(`⚡️ [Server]: Server is running on port: ${port}`);
});
