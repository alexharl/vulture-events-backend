import { upsertEvents } from '../db/index.js';
import { ActionResponse } from '../model/actionResponse.js';
import { loadEvents } from '../scraper/zbau.js';

export async function performImport() {
  console.log(`[ZBau] Import started`);

  // scrape website
  const scrapeResponse = await loadEvents();
  if (!scrapeResponse.success) {
    console.log(`[ZBau] Import failed:`, scrapeResponse.message);
    return ActionResponse.Error('Scrape failed');
  }
  if (!scrapeResponse.data || !scrapeResponse.success) {
    console.log(`[ZBau] Import failed: No events found`);
    return ActionResponse.Data({ scraped: 0 });
  }

  // insert events into db
  const dbResponse = await upsertEvents('zbau', scrapeResponse.data);
  if (!dbResponse.success || !dbResponse.data) {
    console.log(`[ZBau] Import failed:`, dbResponse.message || 'Unknown');
    return ActionResponse.Error('DB Error');
  }

  return ActionResponse.Data({ ...dbResponse.data, scraped: scrapeResponse.data.length });
}
