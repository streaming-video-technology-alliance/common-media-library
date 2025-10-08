import type { FullBox } from './FullBox.js';

/**
 * Sample Auxiliary Information Sizes Box - 'saiz'
 *
 *
 * @beta
 */
export type SampleAuxiliaryInformationSizesBox = FullBox & {
	type: 'saiz';
	auxInfoType?: number;
	auxInfoTypeParameter?: number;
	defaultSampleInfoSize: number;
	sampleCount: number;
	sampleInfoSize?: number[];
};
