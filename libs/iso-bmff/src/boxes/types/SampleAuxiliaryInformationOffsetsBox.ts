import type { FullBox } from './FullBox.ts'

/**
 * Sample Auxiliary Information Offsets Box - 'saio'
 *
 * @public
 */
export type SampleAuxiliaryInformationOffsetsBox = FullBox & {
	type: 'saio';
	auxInfoType?: number;
	auxInfoTypeParameter?: number;
	entryCount: number;
	offset: number[];
};
