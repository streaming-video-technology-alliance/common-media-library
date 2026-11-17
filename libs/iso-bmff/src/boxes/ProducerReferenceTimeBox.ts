import type { IsoInt64 } from '../IsoInt64.ts'
import type { FullBox } from './FullBox.ts'

/**
 * Producer Reference Time Box (`prft`).
 *
 * ISO/IEC 14496-12:2015 - 8.16.5
 *
 * @public
 */
export type ProducerReferenceTimeBox<V extends IsoInt64 = number> = FullBox & {
	type: 'prft'
	referenceTrackId: number
	ntpTimestampSec: number
	ntpTimestampFrac: number
	mediaTime: V
}
