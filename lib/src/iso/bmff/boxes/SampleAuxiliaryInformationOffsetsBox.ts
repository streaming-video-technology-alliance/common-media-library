import type { FullBox } from './FullBox.js';

/**
 * Sample Auxiliary Information Offsets Box - 'saio'
 */
export type SampleAuxiliaryInformationOffsetsBox = FullBox & {
	type: 'saio';
	auxInfoType?: number;
	auxInfoTypeParameter?: number;
	entryCount: number;
	offset: number[];
};
