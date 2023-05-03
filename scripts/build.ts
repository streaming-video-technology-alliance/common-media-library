import { rm } from 'node:fs/promises';
import { cmd } from './cmd.js';
import { removeBlankFiles } from './removeBlankFiles.js';

await rm('dist', { recursive: true, force: true });
await cmd('tsc');
await removeBlankFiles();
