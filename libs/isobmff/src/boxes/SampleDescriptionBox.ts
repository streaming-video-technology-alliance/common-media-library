import type { FullBox } from './FullBox.js';
import type { SampleEntryBox } from './SampleEntryBox.js';

/**
 * ISO/IEC 14496-12:2012 - 8.5.2 Sample Description Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type SampleDescriptionBox<E extends SampleEntryBox = SampleEntryBox> = FullBox & {
	type: 'stsd';
	entryCount: number,
	entries: E[],
};
