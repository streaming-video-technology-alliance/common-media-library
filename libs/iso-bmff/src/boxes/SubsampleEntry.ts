import type { Subsample } from './Subsample.ts'

/**
 * Sub sample entry
 *
 * @public
 */
export type SubsampleEntry = {
	sampleDelta: number;
	subsampleCount: number;
	subsamples: Subsample[];
};
