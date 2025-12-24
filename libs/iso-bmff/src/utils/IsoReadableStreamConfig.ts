import type { Box } from '../boxes/Box.ts';
import type { IsoDataWriter } from './IsoDataWriter.ts';

export type IsoReadableStreamConfig = {
  writers: Record<string, (box: Box) => IsoDataWriter>;
};
