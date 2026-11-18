import type { FullBox } from './FullBox.ts'

/**
 * Compact Sample Size Box (`stz2`).
 *
 * ISO/IEC 14496-12:2015 - 8.7.3
 *
 * @public
 */
export type CompactSampleSizeBox = FullBox & {
	type: 'stz2'
	fieldSize: number
	sampleCount: number
	entrySize: number[]
}
