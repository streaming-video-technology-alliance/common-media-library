import type { FullBox } from './FullBox.js';

/**
 * An edit list entry.
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type EditListEntry = {
	segmentDuration: number;
	mediaTime: number;
	mediaRateInteger: number;
	mediaRateFraction: number;
};

/**
 * ISO/IEC 14496-12:2012 - 8.6.6 Edit List Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type EditListBox = FullBox & {
	type: 'elst';
	entryCount: number;
	entries: EditListEntry[];
};
