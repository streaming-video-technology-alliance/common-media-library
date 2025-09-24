import type { Subsample } from './Subsample.js';

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
