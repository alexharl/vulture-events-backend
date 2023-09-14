import dotenv from 'dotenv';
dotenv.config();

import { Telegraf } from 'telegraf';
import db from './db/index.js';

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

dayjs.extend(customParseFormat);
dayjs.locale('de');

import formatter from './bot/formatter.js';
import scraper from './scraper/index.js';

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.command('import', async ctx => {
  let message = '*Import*\n';

  const events = await scraper.zbau();
  await db.saveEvents('zbau', events);
  message += `${events.length} Events von Z\\-Bau importiert\n`;

  ctx.sendMessage(message, { parse_mode: 'MarkdownV2' });
});

bot.command('events', async ctx => {
  const incomingMessage = ctx.message.text.replace('/events', '').trim();

  const events = await db.getEvents(incomingMessage.length ? { query: incomingMessage } : null);
  let message = '';
  if (!incomingMessage.length) {
    message = `*Nächste Events*\n\n`;
  } else {
    message = `*Events für ${formatter.escapeMessage(incomingMessage)}*\n\n`;
  }

  if (events.length > 10) {
    events.length = 10;
  }

  message += formatter.eventsToMessage(events);

  ctx.sendMessage(message, { parse_mode: 'MarkdownV2' });
});

bot.command('gettags', async ctx => {
  const tags = await db.getTags();
  let message = `*Tags*\n\n`;
  tags.forEach(tag => {
    message += `${formatter.escapeMessage(tag)}\n`;
  });
  ctx.sendMessage(message, { parse_mode: 'MarkdownV2' });
});

bot.command('tags', async ctx => {
  const incomingMessage = ctx.message.text.replace('/tags', '').trim();
  if (!incomingMessage.length) {
    ctx.sendMessage('Es wurde kein Filter angegeben', { parse_mode: 'MarkdownV2' });
  } else {
    const events = await db.getEvents({ tags: incomingMessage });

    let message = `*Events für ${formatter.escapeMessage(incomingMessage)}*\n\n`;
    message += formatter.eventsToMessage(events);

    ctx.sendMessage(message, { parse_mode: 'MarkdownV2' });
  }
});

bot.command('weekend', async ctx => {
  const events = await db.getEvents({ nextWeekend: '1' });

  let message = '*Events am Wochenende*\n\n';
  message += formatter.eventsToMessage(events);

  ctx.sendMessage(message, { parse_mode: 'MarkdownV2' });
});

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
