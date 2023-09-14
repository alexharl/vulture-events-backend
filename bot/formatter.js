import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

dayjs.extend(customParseFormat);
dayjs.locale('de');

function escapeMarkdownV2(text) {
  return text.replace(/[_*\[\]()~`>#\+\-=|{}.!]/g, '\\$&');
}

function eventToFormattedMessage(event) {
  let message = `*[${escapeMarkdownV2(event.title)}](${escapeMarkdownV2(event.url)})*\n`;
  if (event.subtitle) {
    message += `${escapeMarkdownV2(event.subtitle)}\n`;
  }
  var dateString = event.begin || event.date;
  message += `${escapeMarkdownV2(dayjs(dateString).format('DD.MM HH:mm'))}\n`;

  message += `${escapeMarkdownV2(event.location.join(', '))}\n`;

  if (event.price) {
    message += `${escapeMarkdownV2(event.price)}\n`;
  }

  return message;
}

function eventsToFormattedMessage(events) {
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

export default {
  eventsToMessage: eventsToFormattedMessage,
  escapeMessage: escapeMarkdownV2
};
