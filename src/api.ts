import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';

import dayjs from 'dayjs';
dayjs.locale('de');
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
dayjs.extend(customParseFormat);

import { ActionResponse } from './model/actionResponse.js';
import { performImport } from './import/zbau.js';

import { initialize as initDB, filterEvents } from './db/index.js';
import { IEventQuery } from './model/db.js';

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

initDB(process.env.DB_PATH as string);

app.post('/import/zbau', async (req: Request, res: Response) => {
  try {
    const importResponse = await performImport();
    res.send(importResponse);
  } catch (e: any) {
    console.log('Import failed:', e.message);
    res.status(500).send(ActionResponse.Error('Server error'));
  }
});

app.get('/events', async (req: Request, res: Response) => {
  try {
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

    const filteredEventsResponse = await filterEvents(query);
    res.send(filteredEventsResponse);
  } catch (e: any) {
    console.log('Filter events failed:', e.message);
    res.status(500).send(ActionResponse.Error('Server error'));
  }
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running on port: ${port}`);
});
