import type { MovieFragmentBox } from '../../boxes/MovieFragmentBox.ts'
import type { MovieFragmentHeaderBox } from '../../boxes/MovieFragmentHeaderBox.ts'
import type { TrackFragmentBox } from '../../boxes/TrackFragmentBox.ts'
import { ContainerBoxBase } from '../ContainerBoxBase.ts'

/**
 * Movie Fragment Box - 'moof' - Container
 */
export class moof extends ContainerBoxBase<MovieFragmentBox, MovieFragmentHeaderBox | TrackFragmentBox> {
	static readonly type = 'moof'

	constructor(boxes: (MovieFragmentHeaderBox | TrackFragmentBox)[] = []) {
		super('moof', boxes)
	}
}
