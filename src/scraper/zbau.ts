import { ActionResponse } from '../model/actionResponse.js';
import { IEvent } from '../model/event.js';

import axios from 'axios';
import cheerio from 'cheerio';
import fs from 'fs';
import dayjs from 'dayjs';
import { resolveCategories } from '../db/categories.js';
import { AlgoliaHit, AlgoliaResponse, ZBauEventDetailResponse } from '../model/responses/zbau.js';

const tagBlacklist = ['präsentiert', 'tour', 'und', 'mit'];

export async function _getApiResponse() {
  try {
    const response = await axios.post(
      'https://pe8x78lvhs-dsn.algolia.net/1/indexes/*/queries',
      {
        requests: [
          {
            indexName: 'zbau-001',
            params: 'facetFilters=%5B%5B%22is_past%3A0%22%5D%5D&page=0&query=&hitsPerPage=1000'
          }
        ]
      },
      {
        headers: {
          'X-Algolia-Api-Key': '95b79d32689c33bb837d0bcc998075f3',
          'x-algolia-application-id': 'PE8X78LVHS'
        }
      }
    );

    // The response will contain the data from Algolia
    return response.data;
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
}

/**
 * Returns the contents of the Z-Bau event api as json.
 * will return the contents of the dummy file if the IMPORT_DUMMY_ZBAU environment variable is set.
 * @returns JSON
 */
async function getApiResponse(): Promise<AlgoliaResponse> {
  const dummyFilepath = process.env.IMPORT_DUMMY_ZBAU;
  if (dummyFilepath) {
    return JSON.parse(fs.readFileSync(dummyFilepath, 'utf-8'));
  } else {
    return await _getApiResponse();
  }
}

async function getEventDetailResponse(slug: string): Promise<ZBauEventDetailResponse | null> {
  try {
    const response = await axios.get(`https://www.z-bau.com/programm/${slug}.json`);
    return response.data;
  } catch (error) {
    console.error('Error fetching event details:', error);
    throw error;
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

async function parseEvent(eventData: AlgoliaHit): Promise<IEvent | null> {
  try {
    const event: IEvent = {
      origin: 'zbau',
      id: eventData.slug,
      dateUnix: 0,
      images: [],
      info: '',
      links: [],
      embeds: []
    };

    event.url = `https://www.z-bau.com/events/${eventData.slug}`;
    event.title = eventData.title;
    event.subtitle = eventData.subtitle;

    event.locations = eventData.location
      .split(',')
      .map(loc => loc.trim())
      .filter(loc => loc.length > 0);

    if (eventData.age_restriction) {
      const $ = cheerio.load(eventData.age_restriction);
      event.ageLimit = $('.age-text').text().trim();
    }

    event.date = eventData.date_title;
    event.time = eventData.start_time;
    event.entryTime = eventData.entry_time;
    if (eventData.start_timestamp) {
      event.dateUnix = parseInt(eventData.start_timestamp);
    }
    if (!event.dateUnix) {
      const date = dayjs(eventData.date_title, 'ddd. DD.MM.');
      if (date.isValid()) {
        event.dateUnix = date.unix() * 1000;
      }
    }

    event.ticketLink = eventData.presale;
    if (eventData.price) {
      const $ = cheerio.load(eventData.price);
      event.price = $('b').next().text().trim();
    }

    event.tags = resolveTags(event.subtitle);

    if (event.title.toLowerCase().includes('dot bass')) {
      event.tags.push('drum and bass');
    }

    event.categories = resolveCategories(event.tags);

    if (event.title?.toLocaleLowerCase().includes('vultures') && event.categories.includes('dnb')) {
      event.categories.push('featured');
    }

    if (event.title?.toLocaleLowerCase().includes('monsters of jungle') && event.categories.includes('dnb')) {
      event.categories.push('featured');
    }

    if (event.title?.toLocaleLowerCase().includes('tsunami sound system') && event.categories.includes('dnb')) {
      event.categories.push('featured');
    }

    if (event.title?.toLocaleLowerCase().includes('dubworx') && event.categories.includes('dnb')) {
      event.categories.push('featured');
    }

    // load event details
    const eventDetailResponse = await getEventDetailResponse(eventData.slug);

    if (eventDetailResponse && eventDetailResponse.html) {
      const $ = cheerio.load(eventDetailResponse.html.content);

      const descriptionElement = $('.event__description');
      const descriptionText = descriptionElement.html() || '';

      if (descriptionText) {
        event.info = descriptionText;
      }

      $('.event__images img').each((_, img) => {
        const src = $(img).attr('data-src');
        if (src) {
          event.images?.push(src);
        }
      });

      $('.event__embed iframe').each((_, iframe) => {
        const src = $(iframe).attr('data-src');
        if (src) {
          let type = 'unknown';
          if ($(iframe).hasClass('type-youtube')) {
            type = 'youtube';
          }
          event.embeds?.push({ type, url: src });
        }
      });

      event.links = [];
      $('.event__links a').each((_, link) => {
        const href = $(link).attr('href');
        const title = $(link).text().trim();
        if (href) {
          event.links?.push({ url: href, title });
        }
      });
    }

    return event;
  } catch (e: any) {
    console.log(`❗️ [Z-Bau] Error parsing event "${eventData.slug}": ${e.message}`);
    return null;
  }
}

export async function loadEvents() {
  // load api content
  const response = await getApiResponse();

  // parse content and convert to event objects
  const parsedEvents = [] as IEvent[];
  console.log(`🔎 [ZBau] loaded ${response.results[0].hits.length} events`);
  for (let eventData of response.results[0].hits) {
    // parse event data
    const event = await parseEvent(eventData);
    if (event) {
      parsedEvents.push(event);
    }
  }

  return ActionResponse.Data(parsedEvents);
}
