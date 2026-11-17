import type { DecodingTimeSample } from './DecodingTimeSample.ts'
import type { FullBox } from './FullBox.ts'

/**
 * Decoding Time To Sample Box (`stts`).
 *
 * ISO/IEC 14496-12:2015 - 8.6.1.2
 *
 * @public
 */
export type DecodingTimeToSampleBox = FullBox & {
	type: 'stts'

	/** A 32-bit integer that specifies the number of entries in the decoding time-to-sample table. */
	entryCount: number

	/** An array of decoding time-to-sample entries. */
	entries: DecodingTimeSample[]
}
