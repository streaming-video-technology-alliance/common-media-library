import type { Subsample } from './Subsample.ts';

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
