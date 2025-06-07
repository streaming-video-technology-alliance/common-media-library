import type { FullBox } from './FullBox.js';
import type { SampleEntry } from './SampleEntry.js';

/**
 * Sample Description Box - 'stsd'
 */
export type SampleDescriptionBox = FullBox & {
	type: 'stsd';
	entryCount: number;
	boxes: Array<SampleEntry>;
};
