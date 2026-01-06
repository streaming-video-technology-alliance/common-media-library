import type { AudioSampleEntryBox } from './AudioSampleEntryBox.ts'
import type { FullBox } from './FullBox.ts'
import type { SampleEntryBox } from './SampleEntryBox.ts'
import type { VisualSampleEntryBox } from './VisualSampleEntryBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.5.2 Sample Description Box
 *
 * @public
 */
export type SampleDescriptionBox<E extends SampleEntryBox = AudioSampleEntryBox | VisualSampleEntryBox> = FullBox & {
	type: 'stsd';
	entryCount: number,
	entries: E[],
};
