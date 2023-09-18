import { IEvent } from '../model/event.js';

/**
 * Escapes markdown v2 special characters
 * @param text
 * @returns
 * @see https://core.telegram.org/bots/api#markdownv2-style
 **/
export function escapeMarkdownV2(text: string) {
  return text.replace(/[_*\[\]()~`>#\+\-=|{}.!]/g, '\\$&');
}

/**
 * Formats an event to a markdown message
 * @param event
 * @returns
 **/
function eventToFormattedMessage(event: IEvent) {
  let message = `*[${escapeMarkdownV2(event.title || '')}](${escapeMarkdownV2(event.url || '')})*\n`;

  // Add subtitle, if present.
  if (event.subtitle) {
    message += `${escapeMarkdownV2(event.subtitle)}\n`;
  }

  // Add date and time.
  var dateString = '📅 ' + (event.date || '');
  if (event.time) {
    dateString += ` ${event.time}`;
  }
  message += `${escapeMarkdownV2(dateString)}\n`;

  // Add locations, if present.
  if (event.locations?.length) {
    message += `🏠 ${escapeMarkdownV2(event.locations.join(', '))}\n`;
  }

  // Add price, if present.
  if (event.price) {
    message += `💰 ${escapeMarkdownV2(event.price)}\n`;
  }

  return message;
}

/**
 * Formats a list of events to a markdown message
 * @param events
 * @returns
 */
export function eventsToFormattedMessage(events: IEvent[]) {
  const NO_EVENTS_FOUND = 'Keine Events gefunden';

  let message = '';
  if (!events.length) {
    message += NO_EVENTS_FOUND;
  } else {
    events.forEach(event => {
      message += eventToFormattedMessage(event);
      message += '\n';
    });
  }

  return message;
}
