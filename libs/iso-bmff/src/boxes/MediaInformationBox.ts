import type { DataInformationBox } from './DataInformationBox.ts'
import type { HintMediaHeaderBox } from './HintMediaHeaderBox.ts'
import type { NullMediaHeaderBox } from './NullMediaHeaderBox.ts'
import type { SampleTableBox } from './SampleTableBox.ts'
import type { SoundMediaHeaderBox } from './SoundMediaHeaderBox.ts'
import type { SubtitleMediaHeaderBox } from './SubtitleMediaHeaderBox.ts'
import type { VideoMediaHeaderBox } from './VideoMediaHeaderBox.ts'

/**
 * Child boxes of Media Information Box
 *
 * @public
 */
export type MediaInformationBoxChild = VideoMediaHeaderBox | SoundMediaHeaderBox | HintMediaHeaderBox | NullMediaHeaderBox | DataInformationBox | SampleTableBox | SubtitleMediaHeaderBox;

/**
 * Media Information Box - 'minf' - Container
 *
 * @public
 */
export type MediaInformationBox = {
	type: 'minf';
	boxes: MediaInformationBoxChild[];
};

/**
 * @public
 */
export type minf = MediaInformationBox;
