import { ActionResponse } from '../model/actionResponse.js';
import { IEvent } from '../model/event.js';

import axios from 'axios';
import cheerio from 'cheerio';
import fs from 'fs';
import dayjs from 'dayjs';
import { resolveCategories } from '../db/categories.js';

const tagBlacklist = ['präsentiert', 'tour', 'und', 'mit'];

/**
 * Load the website content
 * @returns HTML string
 */
async function getHtml() {
  const dummyFilepath = process.env.IMPORT_DUMMY_ZBAU;
  if (dummyFilepath) {
    return fs.readFileSync(dummyFilepath, 'utf-8');
  } else {
    const webResponse = await axios.get('https://z-bau.com/programm/');
    return webResponse.data;
  }
}

/**
 * Resolves text to a list of tags
 * @param text - text to resolve
 * @returns List of tags
 */
function resolveTags(text: string) {
  let tags = new Set<string>();

  let potentialTags = text.split(/,|\+/).map(tag => tag.trim());
  for (let tag of potentialTags) {
    if (tag.length <= 2) continue;
    if (tagBlacklist.includes(tag.toLowerCase())) continue;
    tags.add(tag);
  }

  return [...tags];
}

function parseEvent(elem: cheerio.Element) {
  let id: string | undefined = '';
  try {
    const $ = cheerio.load(elem);
    id = $(elem).attr('data-id');
    if (!id) return null;

    const event: IEvent = {
      origin: 'zbau',
      id,
      dateUnix: 0
    };

    // Allgemein
    event.url = $(elem).attr('data-url');
    event.title = $(elem).find('.event__main-title span').text().trim();
    event.subtitle = $(elem).find('.event__sub-title span').text().trim();
    event.info = $(elem).find('.event__info-text').html()?.trim();
    event.ageLimit = $(elem).find('.event__alter .alter').text().trim();

    // Datum
    const dayString = $(elem).find('.event__day').text().trim();
    const dateString = dayString.split('\n')[1].trim() + new Date().getFullYear();
    event.date = dateString;
    event.entryTime = $(elem).find('.event__einlass').text().trim();
    const startTime = $(elem).find('.event__beginn').text().trim();
    if (startTime) {
      event.time = startTime;
      event.dateUnix = dayjs(dateString + ' ' + startTime, 'DD.MM.YYYY HH:mm').unix();
    } else {
      event.dateUnix = dayjs(dateString, 'DD.MM.YYYY').unix();
    }

    // Location
    const locationString = $(elem).find('.event__location').text().trim();
    event.locations = locationString.split(',').map(loc => loc.trim());

    // Ticket
    event.ticketLink = $(elem).find('.event__ticket-link').attr('href');
    const ticketDiv = $(elem).find('.event__eintritt');
    ticketDiv.find('.event__ticket-link').remove();
    event.price = ticketDiv.text().replace(/\s\s+/g, ' ').trim();

    // Bilder
    $(elem)
      .find('.event__image')
      .each((i, elem) => {
        const imageUrl = $(elem).attr('data-src');
        if (imageUrl) {
          if (!event.images) {
            event.images = [];
          }

          event.images.push(imageUrl);
        }
      });

    // Tags & Categories
    event.tags = resolveTags(event.subtitle);
    event.categories = resolveCategories(event.tags);

    return event;
  } catch (e: any) {
    console.log(`❗️ [ZBau] Error parsing event "${id}"`);
    return null;
  }
}

async function parseHtml(html: string) {
  const $ = cheerio.load(html);
  const events = [] as IEvent[];

  $('article').each((i, elem) => {
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
