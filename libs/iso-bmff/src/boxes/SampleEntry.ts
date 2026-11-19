import type { IsoInt64 } from '../IsoInt64.ts'
import type { ParsedIsoBox } from '../ParsedIsoBox.ts'
import type { IsoBoxType } from '../IsoBoxType.ts'

/**
 * Sample Entry, the base of every sample entry box.
 *
 * ISO/IEC 14496-12:2015 - 8.5.2
 *
 * @public
 */
export type SampleEntry<T extends IsoBoxType = IsoBoxType, V extends IsoInt64 = number> = {
	type: T
	dataReferenceIndex: number
	boxes: ParsedIsoBox<V>[]
}
