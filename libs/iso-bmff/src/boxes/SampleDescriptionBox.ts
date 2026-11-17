import type { AudioSampleEntryBox } from './AudioSampleEntryBox.ts'
import type { FullBox } from './FullBox.ts'
import type { SampleEntryBox } from './SampleEntryBox.ts'
import type { VisualSampleEntryBox } from './VisualSampleEntryBox.ts'

/**
 * Sample Description Box (`stsd`).
 *
 * ISO/IEC 14496-12:2015 - 8.5.2
 *
 * @public
 */
export type SampleDescriptionBox<
	E extends SampleEntryBox = AudioSampleEntryBox | VisualSampleEntryBox,
> = FullBox & {
	type: 'stsd'
	entryCount: number
	entries: E[]
}
