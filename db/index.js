import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

import dayjs from 'dayjs';

// db.json file path
const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, 'db.json');

// Configure lowdb to write data to JSON file
const adapter = new JSONFile(file);
const defaultData = { events: [], tags: [], locations: [] };
const db = new Low(adapter, defaultData);

export default {
  saveEvents: async function (origin, events) {
    await db.read();

    // remove events that are not in the new list but have the same origin
    db.data.events = db.data.events.filter(event => event.origin !== origin);
    db.data.events.push(...events);

    // update existing events by id
    for (const event of events) {
      const existingEvent = db.data.events.find(existingEvent => existingEvent.id === event.id);
      if (existingEvent) {
        Object.assign(existingEvent, event);
      }
    }

    db.data.events.sort((a, b) => dayjs(a.date).unix() - dayjs(b.date).unix());

    const locations = [...new Set(db.data.events.map(event => event.location).flat())];
    locations.map(location => {
      return { name: location, origin: origin };
    });
    db.data.locations = db.data.locations.filter(location => location.origin === origin);
    db.data.locations.push(...locations);

    const tags = [...new Set(db.data.events.map(event => event.tags).flat())];
    tags.map(tag => {
      return { name: tag, origin: origin };
    });
    db.data.tags = db.data.tags.filter(tag => tag.origin === origin);
    db.data.tags.push(...tags);

    await db.write();
  },
  getEvents: async function (filter) {
    await db.read();
    let events = [...db.data.events];
    if (filter) {
      if (filter.origin) {
        events = events.filter(event => event.origin === filter.origin);
      }
      if (filter.query) {
        events = events.filter(event => {
          const query = filter.query.toLowerCase();
          return event.title.toLowerCase().includes(query) || event.subtitle.toLowerCase().includes(query) || event.info.toLowerCase().includes(query);
        });
      }
      if (filter.tags) {
        const tags = filter.tags.split(',').map(t => t.trim().toLowerCase());
        if (tags.length) {
          events = events.filter(event => {
            const lowerTags = event.tags.map(tag => tag.toLowerCase());
            return tags.some(tag => lowerTags.includes(tag));
          });
        }
      }
      if (filter.nextWeekend === '1') {
        events = events.filter(event => {
          const now = dayjs();
          const nextFriday = now.day(5);
          const nextSunday = now.day(7);
          return dayjs(event.date).unix() > nextFriday.startOf('d').add(-1, 'h').unix() && dayjs(event.date).unix() < nextSunday.endOf('d').add(1, 'h').unix();
        });
      }
    }
    return events;
  },
  getTags: async function () {
    await db.read();
    return db.data.tags;
  },
  getLocations: async function () {
    await db.read();
    return db.data.locations;
  }
};
