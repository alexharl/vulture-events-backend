import { ActionResponse } from '../model/actionResponse.js';
import { IEvent } from '../model/event.js';

import axios from 'axios';
import cheerio from 'cheerio';
import fs from 'fs';
import dayjs from 'dayjs';
import { resolveCategories } from '../db/categories.js';

const tagBlacklist = ['präsentiert', 'tour', 'und', 'mit'];
/**
 * Returns the contents of the Rakete Ticket website as a string.
 * will return the contents of the dummy file if the IMPORT_DUMMY_RAKETE environment variable is set.
 * @returns HTML string
 */
async function getHtml() {
  const dummyFilepath = process.env.IMPORT_DUMMY_RAKETE;
  if (dummyFilepath) {
    return fs.readFileSync(dummyFilepath, 'utf-8');
  } else {
    const webResponse = await axios.get('https://dieraketenbg.ticket.io/');
    return webResponse.data;
  }
}

/**
 * Resolves text to a list of tags
 * @param text - text to resolve
 * @returns List of tags
 */
function resolveTags(text: string) {
  const tags = new Set<string>();
  const potentialTags = text.split(/,|\+/).map(tag => tag.trim());

  for (const tag of potentialTags) {
    if (tag.length <= 2) {
      continue;
    }
    if (tagBlacklist.includes(tag.toLowerCase())) {
      continue;
    }
    tags.add(tag);
  }

  return [...tags];
}

function parseEvent(elem: cheerio.Element) {
  let idValue: string | undefined = '';
  try {
    const $ = cheerio.load(elem);
    idValue = $(elem).attr('id');
    if (!idValue) return null;

    const id = idValue.replace('event-row-', '');

    const event: IEvent = {
      origin: 'rakete',
      id,
      dateUnix: 0
    };

    // Allgemein
    event.title = $('.a-eventlink').text();
    event.info = $('i.material-symbols-rounded:contains("info")').next('span').text();
    event.ageLimit = '18+';

    const dateString = $('i.material-symbols-rounded:contains("calendar_month")').next('span').text().split(' ')[1];
    event.date = dateString.split('/').join('.');
    const startTime = $('i.material-symbols-rounded:contains("schedule")').next('span').text().replace(' Uhr', '');
    if (startTime) {
      event.time = startTime;
      event.dateUnix = dayjs(dateString + ' ' + startTime, 'DD.MM.YYYY HH:mm').unix();
    } else {
      event.dateUnix = dayjs(dateString, 'DD.MM.YYYY').unix();
    }

    // Ticket
    event.ticketLink = `https://dieraketenbg.ticket.io/${id}`;
    event.price = $('i.material-symbols-rounded:contains("confirmation_number")').next('span').text();

    let imageUrl = $('img').attr('src');
    if (imageUrl) {
      if (imageUrl.startsWith('/')) imageUrl = 'https:' + imageUrl;
      event.images = [imageUrl];
    }

    event.categories = ['techno'];

    // Location
    const locationString = $('i.material-symbols-rounded:contains("location_on")').next('span').text();
    event.locations = [locationString || 'Rakete'];

    return event;
  } catch (e: any) {
    console.log(`❗️ [Rakete] Error parsing event "${idValue}"`);
    return null;
  }
}

/**
 * Parses the HTML of the event page and returns an array of events
 */
async function parseHtml(html: string) {
  const $ = cheerio.load(html);
  const events = [] as IEvent[];

  $('td.row[id][data-search][data-order]').each((i, elem) => {
    const parsedEvent = parseEvent(elem);
    if (parsedEvent) events.push(parsedEvent);
  });

  return events;
}

export async function loadEvents() {
  // load website content
  const html = await getHtml();
  // parse content and convert to event objects
  const parsedEvents = await parseHtml(html);

  return ActionResponse.Data(parsedEvents);
}
