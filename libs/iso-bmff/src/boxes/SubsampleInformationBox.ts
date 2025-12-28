import type { FullBox } from './FullBox.ts'
import type { SubsampleEntry } from './SubsampleEntry.ts'

/**
 * ISO/IEC 14496-12:2015 - 8.7.7 Sub-Sample Information Box
 *
 * @public
 */
export type SubsampleInformationBox = FullBox & {
	type: 'subs';
	entryCount: number;
	entries: SubsampleEntry[];
};

/**
 * @public
 */
export type subs = SubsampleInformationBox;
