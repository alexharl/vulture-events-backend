import dotenv from 'dotenv';
dotenv.config();

import { Telegraf } from 'telegraf';

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import { performImport } from './import/zbau.js';

dayjs.extend(customParseFormat);
dayjs.locale('de');

import { filterEvents, initialize as initDB } from './db/index.js';
import { escapeMarkdownV2, eventsToFormattedMessage } from './bot/message.js';
import { categories } from './db/categories.js';

initDB(process.env.DB_PATH as string);

if (!process.env.BOT_TOKEN) {
  throw new Error('No bot token provided');
}

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.command('import', async ctx => {
  console.log('🟢 [BOT] Importing ZBAU events');
  let messageText = '*Importing ZBAU events*';
  const messageSent = await ctx.sendMessage(messageText, { parse_mode: 'MarkdownV2' });
  try {
    const importResponse = await performImport();
    if (importResponse.success) {
      messageText += '\n' + importResponse.data?.updated + ' updated';
      messageText += '\n' + importResponse.data?.deleted + ' deleted';
      messageText += '\n' + importResponse.data?.created + ' created';
    } else {
      messageText += '\nFAILED:' + importResponse.message;
    }
    ctx.telegram.editMessageText(ctx.chat.id, messageSent.message_id, undefined, messageText, { parse_mode: 'MarkdownV2' });
  } catch (e: any) {
    console.log('⭕️ [BOT] Import failed:', e.message);
    messageText += '\nFAILED: Unknown error';
    ctx.telegram.editMessageText(ctx.chat.id, messageSent.message_id, undefined, messageText, { parse_mode: 'MarkdownV2' });
  }
});

bot.command('weekend', async ctx => {
  const events = await filterEvents({ nextWeekend: true });
  let message = '*Events am Wochenende*\n\n';
  if (!events.success) {
    message += 'Fehler beim Laden der Events';
  } else {
    message += eventsToFormattedMessage(events.data || []);
  }

  ctx.sendMessage(message, { parse_mode: 'MarkdownV2' });
});

bot.command('categories', async ctx => {
  const chunkedCategories = [...Array(Math.ceil(categories.length / 2))].map(_ =>
    categories.splice(0, 2).map(category => {
      return {
        text: category.name,
        callback_data: category.id
      };
    })
  );

  ctx.reply('Wähle eine der Kategorien', {
    reply_markup: {
      inline_keyboard: [...chunkedCategories]
    }
  });
});

function stringsToRegexPattern(strings: string[]): string {
  // Escape any special regex characters in each string
  let escapedStrings = strings.map(str => {
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  });
  return `(${escapedStrings.join('|')})`;
}

const categoriesRegex = new RegExp(stringsToRegexPattern(categories.map(c => c.id)), 'g');
bot.action(categoriesRegex, async ctx => {
  ctx.answerCbQuery();

  const categoryId = ctx.match[0];
  const category = categories.find(c => c.id === categoryId);

  if (category) {
    const events = await filterEvents({ categories: [category.id] });
    let message = `*${category.name}*\n\n`;
    if (!events.success) {
      message += 'Fehler beim Laden der Events';
    } else {
      message += eventsToFormattedMessage(events.data || []);
    }

    ctx.sendMessage(message, { parse_mode: 'MarkdownV2' });
  } else {
    ctx.sendMessage(`Unbekannte Kategorie '${categoryId}'`, { parse_mode: 'MarkdownV2' });
  }
});

bot.command('events', async ctx => {
  const incomingMessage = ctx.message.text.replace('/events', '').trim();

  const events = await filterEvents(incomingMessage.length ? { text: incomingMessage, limit: 5 } : {});

  let message = '';
  if (!incomingMessage.length) {
    message = `*Nächste Events*\n\n`;
  } else {
    message = `*Events für \'${escapeMarkdownV2(incomingMessage)}\'*\n\n`;
  }

  if (!events.success) {
    message += 'Fehler beim Laden der Events';
  } else {
    message += eventsToFormattedMessage(events.data || []);
  }

  ctx.sendMessage(message, { parse_mode: 'MarkdownV2' });
});

bot.launch();
console.log('🟢 [BOT] Bot started');

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
