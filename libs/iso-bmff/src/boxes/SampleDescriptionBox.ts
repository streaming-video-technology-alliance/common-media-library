import type { IsoBoxType } from '../IsoBoxType.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import type { AudioSampleEntryType } from './AudioSampleEntryType.ts'
import type { VisualSampleEntryType } from './VisualSampleEntryType.ts'
import type { AudioSampleEntry } from './AudioSampleEntry.ts'
import type { FullBox } from './FullBox.ts'
import type { IsoRawBox } from '../IsoRawBox.ts'
import type { SampleEntry } from './SampleEntry.ts'
import type { VisualSampleEntry } from './VisualSampleEntry.ts'

/**
 * Sample Description Box (`stsd`).
 *
 * ISO/IEC 14496-12:2015 - 8.5.2
 *
 * @public
 */
export type SampleDescriptionBox<
	V extends IsoInt64 = number,
	E extends SampleEntry<IsoBoxType, V> | IsoRawBox =
		| AudioSampleEntry<AudioSampleEntryType, V>
		| VisualSampleEntry<VisualSampleEntryType, V>
		| IsoRawBox,
> = FullBox & {
	type: 'stsd'
	boxes: E[]
}
