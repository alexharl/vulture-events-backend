import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

import dayjs from 'dayjs';

import { IEvent } from '../model/event.js';
import { DBSchema, IDBUpsertResult, IEventQuery } from '../model/db.js';
import { ActionResponse } from '../model/actionResponse.js';

let db: Low<DBSchema>;

/**
 * Initializes to Database
 * @param dbPath - Filepath for DB
 */
export async function initialize(dbPath: string) {
  if (!dbPath) {
    throw new Error('No DB path specified!');
  }

  // Configure lowdb to write data to JSON file
  const adapter = new JSONFile<DBSchema>(dbPath);
  const defaultData: DBSchema = { events: [] };
  db = new Low<DBSchema>(adapter, defaultData);

  await db.read();
  console.log(`💾 [DB]: initialized with ${db.data.events.length} events`);
}

/**
 * Upserts events into the database
 * @param origin - Import origin of events
 * @param events - List of imported events
 * @returns ActionResponse
 */
export async function upsertEvents(origin: string, events: IEvent[]) {
  // refresh data in memory
  await db.read();

  let numEventsCreated = 0;
  let numEventsUpdated = 0;
  let numEventsDeleted = 0;

  // Step 1: Remove events from the db that have the given origin and are not present in the new import array
  const newEventIds = events.map(e => e.id);
  db.data.events = db.data.events.filter(eventObj => {
    if (eventObj.origin === origin && !newEventIds.includes(eventObj.id)) {
      numEventsDeleted++;
      return false;
    }
    return true;
  });

  // Step 2: Update events with the same id and create new events
  events.forEach(newObj => {
    const index = db.data.events.findIndex(eventObj => eventObj.id === newObj.id && eventObj.origin === origin);
    if (index !== -1) {
      // Update object
      // TODO: evtl manche properties bestehen lassen
      db.data.events[index] = newObj;
      numEventsUpdated++;
    } else {
      db.data.events.push(newObj); // Create new object
      numEventsCreated++;
    }
  });

  // commit to db
  await db.write();

  console.log(`💾 [DB]: '${origin}' import completed with ${numEventsCreated} created, ${numEventsDeleted} deleted, ${numEventsUpdated} updated`);
  return ActionResponse.Data<IDBUpsertResult>({ created: numEventsCreated, updated: numEventsUpdated, deleted: numEventsDeleted });
}

/**
 * Get event by id
 * @param id - Event id
 * @returns ActionResult with event
 */
export async function getEventById(id: string) {
  const event = db.data.events.find(event => event.id === id);
  if (!event) {
    return ActionResponse.Error('Event not found');
  }
  return ActionResponse.Data(event);
}

/**
 * Filter events
 * @param query - Query object
 * @returns ActionResult with events array
 */
export function filterEvents(query: IEventQuery) {
  // for weekend filter
  const now = dayjs();
  const startOfDay = now.startOf('d').unix();
  const nextFriday = now.day(5);
  const nextSunday = now.day(7);

  let filteredEvents = db.data.events.filter(event => {
    // filter out old events
    if (event.dateUnix && event.dateUnix < startOfDay) return false;

    if (!query) return true;

    // check origin
    if (query.origin && event.origin !== query.origin) return false;

    // match categories (only one)
    if (query.categories?.length) {
      if (!event.categories?.length) return false;

      const match = event.categories.some(category => query.categories?.includes(category));
      if (!match) return false;
    }

    // regex match text
    if (query.text?.length) {
      let regexMatchText = '';
      if (event.title) regexMatchText += event.title + ' ';
      if (event.subtitle) regexMatchText += event.subtitle + ' ';
      if (event.info) regexMatchText += event.info + ' ';

      if (!new RegExp(query.text, 'ig').test(regexMatchText)) return false;
    }

    // filter for weekend
    if (query.nextWeekend) {
      if (!event.dateUnix) return false;

      const startOfWeekend = nextFriday.startOf('d').add(-1, 'h').unix();
      const endOfWeekend = nextSunday.endOf('d').add(1, 'h').unix();
      const isWeekend = event.dateUnix > startOfWeekend && event.dateUnix < endOfWeekend;
      if (!isWeekend) return false;
    }

    return true;
  });

  // limit
  filteredEvents = filteredEvents.slice(0, query.limit || 10);

  // sort
  filteredEvents = filteredEvents.sort((a, b) => a.dateUnix - b.dateUnix);

  return ActionResponse.Data(filteredEvents);
}
