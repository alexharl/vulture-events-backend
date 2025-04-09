import { Router, Request, Response } from 'express';
import { ActionResponse } from '../model/actionResponse.js';
import { performImport as importZbau } from '../import/zbau.js';
import { performImport as importRakete } from '../import/rakete.js';
import { performImport as importHaus33 } from '../import/haus33.js';

const router = Router();

const importers: { [source: string]: () => Promise<ActionResponse<any>> } = {
  zbau: importZbau,
  rakete: importRakete,
  haus33: importHaus33
};

router.post('/:source', async (req: Request, res: Response) => {
  console.log(`🟢 [API] Importing '${req.params.source}' events`);
  try {
    const importer = importers[req.params.source];
    if (!importer) throw new Error(`${req.params.source} is not a valid import source!`);
    const importResponse = await importer();
    res.send(importResponse);
  } catch (e: any) {
    console.log('⭕️ [API] Import failed:', e.message);
    res.status(500).send(ActionResponse.Error('Server error'));
  }
});

router.post('/', async (req: Request, res: Response) => {
  console.log('🟢 [API] Importing all origins');
  try {
    const importTasks = Object.keys(importers).map(source => {
      return { source, importer: importers[source]().catch(() => null) };
    });
    await Promise.all(importTasks.map(task => task.importer));
    const response: { [source: string]: ActionResponse<any> | null } = {};
    for (let task of importTasks) {
      response[task.source] = await task.importer;
    }
    res.send(ActionResponse.Data(response));
  } catch (e: any) {
    console.log('⭕️ [API] Import failed:', e.message);
    res.status(500).send(ActionResponse.Error('Server error'));
  }
});

export default router;
