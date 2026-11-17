import type { FullBox } from './FullBox.ts'

/**
 * Sample Size Box (`stsz`).
 *
 * ISO/IEC 14496-12:2015 - 8.7.3
 *
 * @public
 */
export type SampleSizeBox = FullBox & {
	type: 'stsz'
	sampleSize: number
	sampleCount: number
	entrySize?: number[]
}
