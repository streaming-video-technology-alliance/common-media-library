import type { ChunkOffsetBox } from './ChunkOffsetBox.js';
import type { CompositionTimeToSampleBox } from './CompositionTimeToSampleBox.js';
import type { ContainerBox } from './ContainerBox.js';
import type { DecodingTimeToSampleBox } from './DecodingTimeToSampleBox.js';
import type { DegradationPriorityBox } from './DegradationPriorityBox.js';
import type { SampleDependencyTypeBox } from './SampleDependencyTypeBox.js';
import type { SampleDescriptionBox } from './SampleDescriptionBox.js';
import type { SampleGroupDescriptionBox } from './SampleGroupDescriptionBox.js';
import type { SampleSizeBox } from './SampleSizeBox.js';
import type { SampleToChunkBox } from './SampleToChunkBox.js';
import type { SampleToGroupBox } from './SampleToGroupBox.js';
import type { ShadowSyncSampleBox } from './ShadowSyncSampleBox.js';
import type { SyncSampleBox } from './SyncSampleBox.js';

/**
 * Sample Table Box - 'stbl' - Container
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type SampleTableBox = ContainerBox<SampleDescriptionBox | DecodingTimeToSampleBox | CompositionTimeToSampleBox | SampleToChunkBox | SampleSizeBox | ChunkOffsetBox | SyncSampleBox | ShadowSyncSampleBox | DegradationPriorityBox | SampleDependencyTypeBox | SampleToGroupBox | SampleGroupDescriptionBox> & {
	type: 'stbl';
};
