import type { FullBox } from './FullBox.js';

/**
 * Sub sample
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type Subsample = {
	subsampleSize: number;
	subsamplePriority: number;
	discardable: number;
	codecSpecificParameters: number;
};

/**
 * Sub sample entry
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type SubsampleEntry = {
	sampleDelta: number;
	subsampleCount: number;
	subsamples: Subsample[];
};

/**
 * ISO/IEC 14496-12:2015 - 8.7.7 Sub-Sample Information Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type SubsampleInformationBox = FullBox & {
	type: 'subs';
	entryCount: number;
	entries: SubsampleEntry[];
};
