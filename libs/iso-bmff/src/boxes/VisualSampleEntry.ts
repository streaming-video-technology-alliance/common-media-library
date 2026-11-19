import type { IsoInt64 } from '../IsoInt64.ts'
import type { IsoBoxType } from '../IsoBoxType.ts'
import type { SampleEntry } from './SampleEntry.ts'
import type { VisualSampleEntryType } from './VisualSampleEntryType.ts'

/**
 * Visual Sample Entry Box, such as `avc1`, `hvc1`, or `encv`.
 *
 * ISO/IEC 14496-12:2015 - 12.1.3
 *
 * @public
 */
export type VisualSampleEntry<
	T extends IsoBoxType = VisualSampleEntryType,
	V extends IsoInt64 = number,
> = SampleEntry<T, V> & {
	type: T
	/** The first `pre_defined` field. `writeVisualSampleEntry` writes 0 for a missing value. */
	preDefined1?: number
	/** The second `pre_defined` field. `writeVisualSampleEntry` writes 0 for a missing value. */
	preDefined2?: number[]
	width: number
	height: number
	horizResolution: number
	vertResolution: number
	frameCount: number
	compressorName: number[]
	depth: number
	/** The third `pre_defined` field. `writeVisualSampleEntry` writes -1 for a missing value, the value of the specification. */
	preDefined3?: number
}
