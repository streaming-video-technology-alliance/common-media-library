import type { IsoBoxType } from '../IsoBoxType.ts'

/**
 * Sample Entry, the base of every sample entry box.
 *
 * ISO/IEC 14496-12:2015 - 8.5.2
 *
 * @public
 */
export type SampleEntry<T extends IsoBoxType = IsoBoxType, C = any> = {
	type: T
	dataReferenceIndex: number
	boxes: C[]
}
