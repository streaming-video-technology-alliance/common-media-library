import type { FullBox } from './FullBox.ts'

/**
 * Sample Auxiliary Information Offsets Box (`saio`).
 *
 * ISO/IEC 14496-12:2015 - 8.7.9
 *
 * @public
 */
export type SampleAuxiliaryInformationOffsetsBox = FullBox & {
	type: 'saio'
	auxInfoType?: number
	auxInfoTypeParameter?: number
	entryCount: number
	offset: number[]
}
