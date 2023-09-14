import axios from 'axios';
import cheerio from 'cheerio';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
dayjs.extend(customParseFormat);
dayjs.locale('de');

async function getHtml() {
  const webResponse = await axios.get('https://z-bau.com/programm/');
  return webResponse.data;
}

function generateTags(subtitles) {
  const blacklist = ['präsentiert', 'tour', 'und', 'mit'];
  let tags = new Set();

  subtitles.forEach(subtitle => {
    let potentialTags = subtitle.split(/,|\+/).map(tag => [tag.trim(), tag.trim().toLowerCase()]);

    potentialTags.forEach(tag => {
      if (tag[1].length > 2 && !blacklist.includes(tag[1])) {
        tags.add(tag[0]);
      }
    });
  });

  const sanitizedTags = [...tags];

  // variationen abfangen und bereinigen
  var variations = {
    DnB: ['dnb', 'drum and bass', 'drum & bass', "drum'n'bass", "drum n' bass", 'drum n bass', 'drumnbass', 'drumandbass']
  };
  Object.keys(variations).forEach(key => {
    const tagsToCheck = variations[key];
    // check if tags contain any of the tagToCheck
    for (let tag of tagsToCheck) {
      if (sanitizedTags.find(t => t.toLowerCase() === tag.toLowerCase())) {
        sanitizedTags.push(key);
        break;
      }
    }
  });

  return sanitizedTags;
}

function parseEvent(elem) {
  const id = elem.attribs['data-id'];
  if (!id) return null;

  const $ = cheerio.load(elem);

  const event = {
    origin: 'zbau'
  };

  // Allgemein
  event.url = $(elem).attr('data-url');
  event.location = $(elem).attr('data-location');
  event.id = $(elem).attr('data-id');

  // Date
  const dayString = $(elem).find('.event__day').text().trim();
  const dateString = dayString.split('\n')[1].trim();
  event.dateString = dateString + new Date().getFullYear();
  event.date = dayjs(event.dateString, 'DD.MM.YYYY').toISOString();

  const einlass = $(elem).find('.event__einlass').text().trim();
  if (einlass) {
    event.entryString = einlass;
    event.entry = dayjs(event.dateString + ' ' + einlass, 'DD.MM.YYYY HH:mm');
  }

  const beginn = $(elem).find('.event__beginn').text().trim();
  if (beginn) {
    event.beginString = beginn;
    event.begin = dayjs(event.dateString + ' ' + beginn, 'DD.MM.YYYY HH:mm');
  }

  // Info
  event.title = $(elem).find('.event__main-title span').text().trim();
  event.subtitle = $(elem).find('.event__sub-title span').text().trim();
  event.tags = generateTags([event.subtitle]);
  const locationString = $(elem).find('.event__location').text().trim();
  event.location = locationString.split(',').map(loc => loc.trim());
  event.info = $(elem).find('.event__info-text').html().trim();
  event.ageLimit = $(elem).find('.event__alter .alter').text().trim();

  // Ticket
  event.ticketLink = $(elem).find('.event__ticket-link').attr('href');
  const ticketDiv = $(elem).find('.event__eintritt');
  ticketDiv.find('.event__ticket-link').remove();
  event.price = ticketDiv.text().replace(/\s\s+/g, ' ').trim();

  event.images = [];
  $(elem)
    .find('.event__image')
    .each((i, elem) => {
      event.images.push($(elem).attr('data-src'));
    });

  return event;
}

async function parseHtml(html) {
  const $ = cheerio.load(html);
  const events = [];

  $('article').each((i, elem) => {
    const parsedEvent = parseEvent(elem);
    if (parsedEvent) events.push(parsedEvent);
  });

  return events;
}

export default async function () {
  const html = await getHtml();
  const events = await parseHtml(html);
  return events;
}
