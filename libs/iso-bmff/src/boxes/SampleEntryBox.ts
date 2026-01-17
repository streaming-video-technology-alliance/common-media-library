import type { IsoBoxType } from '../IsoBoxType.ts'

/**
 * ISO/IEC 14496-12:2015 - 8.5.2.2 Sample Entry
 *
 * @public
 */
export type SampleEntryBox<T extends IsoBoxType = IsoBoxType, C = any> = {
	type: T;
	reserved1: number[];
	dataReferenceIndex: number;
	boxes: C[];
};
