import { IEvent } from '../model/event.js';

export function escapeMarkdownV2(text: string) {
  return text.replace(/[_*\[\]()~`>#\+\-=|{}.!]/g, '\\$&');
}

function eventToFormattedMessage(event: IEvent) {
  let message = `*[${escapeMarkdownV2(event.title || '')}](${escapeMarkdownV2(event.url || '')})*\n`;

  if (event.subtitle) {
    message += `${escapeMarkdownV2(event.subtitle)}\n`;
  }

  var dateString = "📅 " + (event.date || '');
  if (event.time) {
    dateString += ` ${event.time}`;
  }
  message += `${escapeMarkdownV2(dateString)}\n`;

  if (event.locations?.length) {
    message += `🏠 ${escapeMarkdownV2(event.locations.join(', '))}\n`;
  }

  if (event.price) {
    message += `💰 ${escapeMarkdownV2(event.price)}\n`;
  }

  return message;
}

export function eventsToFormattedMessage(events: IEvent[]) {
  let message = '';
  if (!events.length) {
    message += 'Keine Events gefunden';
  } else {
    events.forEach(event => {
      message += eventToFormattedMessage(event);
      message += '\n';
    });
  }

  return message;
}
