import type { ChunkOffsetBox } from './ChunkOffsetBox.ts'
import type { CompositionTimeToSampleBox } from './CompositionTimeToSampleBox.ts'
import type { DecodingTimeToSampleBox } from './DecodingTimeToSampleBox.ts'
import type { DegradationPriorityBox } from './DegradationPriorityBox.ts'
import type { SampleDependencyTypeBox } from './SampleDependencyTypeBox.ts'
import type { SampleDescriptionBox } from './SampleDescriptionBox.ts'
import type { SampleGroupDescriptionBox } from './SampleGroupDescriptionBox.ts'
import type { SampleSizeBox } from './SampleSizeBox.ts'
import type { SampleToChunkBox } from './SampleToChunkBox.ts'
import type { SampleToGroupBox } from './SampleToGroupBox.ts'
import type { ShadowSyncSampleBox } from './ShadowSyncSampleBox.ts'
import type { SyncSampleBox } from './SyncSampleBox.ts'

/**
 * Child boxes of Sample Table Box
 *
 * @public
 */
export type SampleTableBoxChild =
	| SampleDescriptionBox
	| DecodingTimeToSampleBox
	| CompositionTimeToSampleBox
	| SampleToChunkBox
	| SampleSizeBox
	| ChunkOffsetBox
	| SyncSampleBox
	| ShadowSyncSampleBox
	| DegradationPriorityBox
	| SampleDependencyTypeBox
	| SampleToGroupBox
	| SampleGroupDescriptionBox

/**
 * Sample Table Box (`stbl`).
 *
 * ISO/IEC 14496-12:2015 - 8.5.1
 *
 * @public
 */
export type SampleTableBox = {
	type: 'stbl'
	boxes: SampleTableBoxChild[]
}
