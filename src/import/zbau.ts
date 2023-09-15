import { upsertEvents } from '../db/index.js';
import { ActionResponse } from '../model/actionResponse.js';
import { IImportResult } from '../model/importInfo.js';
import { loadEvents } from '../scraper/zbau.js';

export async function performImport() {
  console.log(`🔎 [ZBau] Import started`);
  const response = new ActionResponse<IImportResult>();

  // scrape website
  const scrapeResponse = await loadEvents();
  if (!scrapeResponse.success) {
    console.log(`🔎 [ZBau] Import failed:`, scrapeResponse.message);
    return response.errored('Scrape failed');
  }
  if (!scrapeResponse.data || !scrapeResponse.success) {
    console.log(`🔎 [ZBau] Import failed: No events found`);
    return response.succeeded({ scraped: 0, created: 0, updated: 0, deleted: 0 });
  }

  // insert events into db
  const dbResponse = await upsertEvents('zbau', scrapeResponse.data);
  if (!dbResponse.success || !dbResponse.data) {
    console.log(`🔎 [ZBau] Import failed:`, dbResponse.message || 'Unknown');
    return response.errored('DB Error');
  }

  return response.succeeded({ ...dbResponse.data, scraped: scrapeResponse.data.length });
}
