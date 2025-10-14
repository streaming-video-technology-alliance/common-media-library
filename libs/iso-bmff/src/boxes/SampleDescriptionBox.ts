import type { FullBox } from './FullBox.ts';
import type { SampleEntryBox } from './SampleEntryBox.ts';

/**
 * ISO/IEC 14496-12:2012 - 8.5.2 Sample Description Box
 *
 *
 * @beta
 */
export type SampleDescriptionBox<E extends SampleEntryBox = SampleEntryBox> = FullBox & {
	type: 'stsd';
	entryCount: number,
	entries: E[],
};
