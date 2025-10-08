import type { ContainerBox } from './ContainerBox.js';
import type { DataInformationBox } from './DataInformationBox.js';
import type { HintMediaHeaderBox } from './HintMediaHeaderBox.js';
import type { NullMediaHeaderBox } from './NullMediaHeaderBox.js';
import type { SampleTableBox } from './SampleTableBox.js';
import type { SoundMediaHeaderBox } from './SoundMediaHeaderBox.js';
import type { VideoMediaHeaderBox } from './VideoMediaHeaderBox.js';

/**
 * Media Information Box - 'minf' - Container
 *
 *
 * @beta
 */
export type MediaInformationBox = ContainerBox<VideoMediaHeaderBox | SoundMediaHeaderBox | HintMediaHeaderBox | NullMediaHeaderBox | DataInformationBox | SampleTableBox> & {
	type: 'minf';
};
