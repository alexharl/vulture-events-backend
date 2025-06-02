import { Router, Request, Response } from 'express';
import { getEventById, filterEvents, getEventsByIds } from '../db/index.js';
import { IEventQuery } from '../model/db.js';
import { ActionResponse } from '../model/actionResponse.js';

const router = Router();

router.get('/:id', async (req: Request, res: Response) => {
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

router.get('/', async (req: Request, res: Response) => {
  console.log('🟢 [API] Filter events');
  try {
    // by ids (for favorites)
    if (req.query.ids?.length && typeof req.query.ids === 'string') {
      const ids = req.query.ids.split(',');
      if (ids.length > 100) {
        return res.status(400).send(ActionResponse.Error('Too many ids, max 100 allowed'));
      }
      const eventsResponse = await getEventsByIds(ids);
      return res.send(eventsResponse);
    }

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
    if (req.query.limit?.length && typeof req.query.limit === 'string') {
      query.limit = parseInt(req.query.limit);
    }

    const filteredEventsResponse = filterEvents(query);
    res.send(filteredEventsResponse);
  } catch (e: any) {
    console.log('⭕️ [API] Filter events failed:', e.message);
    res.status(500).send(ActionResponse.Error('Server error'));
  }
});

export default router;
