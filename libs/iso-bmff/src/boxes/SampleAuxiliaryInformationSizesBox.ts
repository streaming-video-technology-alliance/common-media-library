import type { FullBox } from './FullBox.ts'

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
