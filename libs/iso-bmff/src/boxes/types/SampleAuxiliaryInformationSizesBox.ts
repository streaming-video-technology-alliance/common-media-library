import type { FullBox } from './FullBox.ts'

/**
 * Sample Auxiliary Information Sizes Box - 'saiz'
 *
 * @public
 */
export type SampleAuxiliaryInformationSizesBox = FullBox & {
	type: 'saiz';
	auxInfoType?: number;
	auxInfoTypeParameter?: number;
	defaultSampleInfoSize: number;
	sampleCount: number;
	sampleInfoSize?: number[];
};
