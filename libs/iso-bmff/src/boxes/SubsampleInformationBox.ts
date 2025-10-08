import type { FullBox } from './FullBox.js';
import type { SubsampleEntry } from './SubsampleEntry.js';

/**
 * ISO/IEC 14496-12:2015 - 8.7.7 Sub-Sample Information Box
 *
 *
 * @beta
 */
export type SubsampleInformationBox = FullBox & {
	type: 'subs';
	entryCount: number;
	entries: SubsampleEntry[];
};
