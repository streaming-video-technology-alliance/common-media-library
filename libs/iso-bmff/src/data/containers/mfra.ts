import type { MovieFragmentRandomAccessBox } from '../../boxes/MovieFragmentRandomAccessBox.ts'
import type { MovieFragmentRandomAccessOffsetBox } from '../../boxes/MovieFragmentRandomAccessOffsetBox.ts'
import type { TrackFragmentRandomAccessBox } from '../../boxes/TrackFragmentRandomAccessBox.ts'
import { ContainerBoxBase } from '../ContainerBoxBase.ts'

/**
 * Movie Fragment Random Access Box - 'mfra' - Container
 */
export class mfra extends ContainerBoxBase<MovieFragmentRandomAccessBox, TrackFragmentRandomAccessBox | MovieFragmentRandomAccessOffsetBox> {
	static readonly type = 'mfra'

	constructor(boxes: (TrackFragmentRandomAccessBox | MovieFragmentRandomAccessOffsetBox)[] = []) {
		super('mfra', boxes)
	}
}
