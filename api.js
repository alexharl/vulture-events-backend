import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
const app = express();
const port = process.env.SERVER_PORT || 3000;

import scraper from './scraper/index.js';
import db from './db/index.js';

app.post('/import/zbau', async (req, res) => {
  try {
    const events = await scraper.zbau();
    await db.saveEvents('zbau', events);
    const response = { success: true, events };
    res.send(response);
  } catch (e) {
    res.send({ success: false, error: e.message });
  }
});

app.get('/events', async (req, res) => {
  try {
    const events = await db.getEvents(req.query);
    const response = { success: true, events };
    res.send(response);
  } catch (e) {
    res.send({ success: false, error: e.message });
  }
});

app.listen(port, () => console.log(`Server started on port ${port}!`));
