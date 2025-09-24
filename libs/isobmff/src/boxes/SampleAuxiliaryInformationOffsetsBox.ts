import type { FullBox } from './FullBox.js';

/**
 * Sample Auxiliary Information Offsets Box - 'saio'
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type SampleAuxiliaryInformationOffsetsBox = FullBox & {
	type: 'saio';
	auxInfoType?: number;
	auxInfoTypeParameter?: number;
	entryCount: number;
	offset: number[];
};
