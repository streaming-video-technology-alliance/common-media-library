import type { FullBox } from './FullBox.ts'

/**
 * Sample Auxiliary Information Offsets Box - 'saio'
 *
 *
 * @beta
 */
export type SampleAuxiliaryInformationOffsetsBox = FullBox<'saio'> & {
	auxInfoType?: number;
	auxInfoTypeParameter?: number;
	entryCount: number;
	offset: number[];
};
