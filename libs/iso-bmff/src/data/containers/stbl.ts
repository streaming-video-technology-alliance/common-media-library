import type { Box } from '../../boxes/Box.ts'
import type { BoxType } from '../../boxes/BoxType.ts'
import type { ChunkOffsetBox } from '../../boxes/ChunkOffsetBox.ts'
import type { CompositionTimeToSampleBox } from '../../boxes/CompositionTimeToSampleBox.ts'
import type { DecodingTimeToSampleBox } from '../../boxes/DecodingTimeToSampleBox.ts'
import type { DegradationPriorityBox } from '../../boxes/DegradationPriorityBox.ts'
import type { SampleDependencyTypeBox } from '../../boxes/SampleDependencyTypeBox.ts'
import type { SampleDescriptionBox } from '../../boxes/SampleDescriptionBox.ts'
import type { SampleSizeBox } from '../../boxes/SampleSizeBox.ts'
import type { SampleTableBox } from '../../boxes/SampleTableBox.ts'
import type { SampleToChunkBox } from '../../boxes/SampleToChunkBox.ts'
import type { ShadowSyncSampleBox } from '../../boxes/ShadowSyncSampleBox.ts'
import type { SyncSampleBox } from '../../boxes/SyncSampleBox.ts'
import { ContainerBoxBase } from '../ContainerBoxBase.ts'

/**
 * Sample Table Box - 'stbl' - Container
 */
export class stbl extends ContainerBoxBase<SampleTableBox, SampleDescriptionBox | DecodingTimeToSampleBox | CompositionTimeToSampleBox | SampleToChunkBox | SampleSizeBox | ChunkOffsetBox | SyncSampleBox | ShadowSyncSampleBox | DegradationPriorityBox | SampleDependencyTypeBox | Box<BoxType>> {
	static readonly type = 'stbl'
	constructor(boxes: (SampleDescriptionBox | DecodingTimeToSampleBox | CompositionTimeToSampleBox | SampleToChunkBox | SampleSizeBox | ChunkOffsetBox | SyncSampleBox | ShadowSyncSampleBox | DegradationPriorityBox | SampleDependencyTypeBox | Box<BoxType>)[] = []) {
		super('stbl', boxes)
	}
}
