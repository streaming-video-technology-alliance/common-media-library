import type { Box } from './boxes/Box.ts'
import type { IsoBoxWriteView } from './IsoBoxWriteView.ts'

export type IsoBoxReadableStreamConfig = {
	writers: Record<string, (box: Box) => IsoBoxWriteView>;
};
