import type { ContainerBox } from './ContainerBox.ts'
import type { DataInformationBox } from './DataInformationBox.ts'
import type { HintMediaHeaderBox } from './HintMediaHeaderBox.ts'
import type { NullMediaHeaderBox } from './NullMediaHeaderBox.ts'
import type { SampleTableBox } from './SampleTableBox.ts'
import type { SoundMediaHeaderBox } from './SoundMediaHeaderBox.ts'
import type { VideoMediaHeaderBox } from './VideoMediaHeaderBox.ts'

/**
 * Media Information Box - 'minf' - Container
 *
 *
 * @beta
 */
export type MediaInformationBox = ContainerBox<VideoMediaHeaderBox | SoundMediaHeaderBox | HintMediaHeaderBox | NullMediaHeaderBox | DataInformationBox | SampleTableBox> & {
	type: 'minf';
};
