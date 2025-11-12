import type { DataInformationBox } from '../../boxes/DataInformationBox.ts'
import type { HintMediaHeaderBox } from '../../boxes/HintMediaHeaderBox.ts'
import type { MediaInformationBox } from '../../boxes/MediaInformationBox.ts'
import type { NullMediaHeaderBox } from '../../boxes/NullMediaHeaderBox.ts'
import type { SampleTableBox } from '../../boxes/SampleTableBox.ts'
import type { SoundMediaHeaderBox } from '../../boxes/SoundMediaHeaderBox.ts'
import type { VideoMediaHeaderBox } from '../../boxes/VideoMediaHeaderBox.ts'
import { ContainerBoxBase } from '../ContainerBoxBase.ts'

/**
 * Media Information Box - 'minf' - Container
 */
export class minf extends ContainerBoxBase<MediaInformationBox, VideoMediaHeaderBox | SoundMediaHeaderBox | HintMediaHeaderBox | NullMediaHeaderBox | DataInformationBox | SampleTableBox> {
	static readonly type = 'minf'

	constructor(boxes: (VideoMediaHeaderBox | SoundMediaHeaderBox | HintMediaHeaderBox | NullMediaHeaderBox | DataInformationBox | SampleTableBox)[] = []) {
		super('minf', boxes)
	}
}
