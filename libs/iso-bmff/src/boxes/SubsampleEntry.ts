import type { Subsample } from './Subsample.js';

/**
 * Sub sample entry
 *
 *
 * @beta
 */
export type SubsampleEntry = {
	sampleDelta: number;
	subsampleCount: number;
	subsamples: Subsample[];
};
