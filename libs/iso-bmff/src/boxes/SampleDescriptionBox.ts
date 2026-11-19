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
	E extends SampleEntry | IsoRawBox = AudioSampleEntry | VisualSampleEntry | IsoRawBox,
> = FullBox & {
	type: 'stsd'
	entryCount: number
	boxes: E[]
}
