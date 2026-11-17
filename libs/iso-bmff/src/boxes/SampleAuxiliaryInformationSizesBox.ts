import type { FullBox } from './FullBox.ts'

/**
 * Sample Auxiliary Information Sizes Box (`saiz`).
 *
 * ISO/IEC 14496-12:2015 - 8.7.8
 *
 * @public
 */
export type SampleAuxiliaryInformationSizesBox = FullBox & {
	type: 'saiz'
	auxInfoType?: number
	auxInfoTypeParameter?: number
	defaultSampleInfoSize: number
	sampleCount: number
	sampleInfoSize?: number[]
}
