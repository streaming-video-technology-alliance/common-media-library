import type { FullBox } from './FullBox.ts'

/**
 * Movie Fragment Header Box (`mfhd`).
 *
 * ISO/IEC 14496-12:2015 - 8.8.5
 *
 * @public
 */
export type MovieFragmentHeaderBox = FullBox & {
	type: 'mfhd'
	sequenceNumber: number
}
