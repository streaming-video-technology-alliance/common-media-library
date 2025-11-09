import { ContainerBox } from '../ContainerBox.ts'
import type { MovieFragmentRandomAccessOffsetBox } from '../MovieFragmentRandomAccessOffsetBox.ts'
import type { TrackFragmentRandomAccessBox } from '../TrackFragmentRandomAccessBox.ts'

/**
 * Movie Fragment Random Access Box - 'mfra' - Container
 */
export class MovieFragmentRandomAccessBox extends ContainerBox<TrackFragmentRandomAccessBox | MovieFragmentRandomAccessOffsetBox> {
	constructor(boxes: (TrackFragmentRandomAccessBox | MovieFragmentRandomAccessOffsetBox)[] = []) {
		super('mfra', boxes)
	}
}
