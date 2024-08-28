import { rm } from 'node:fs/promises';
import { cmd } from './cmd.mjs';
import { removeBlankFiles } from './removeBlankFiles.mjs';

await rm('dist', { recursive: true, force: true });
await cmd('tsc');
await removeBlankFiles();
