import { ContainerBox } from '../ContainerBox.ts'
import type { MovieFragmentHeaderBox } from '../MovieFragmentHeaderBox.ts'
import type { TrackFragmentBox } from './TrackFragmentBox.ts'

/**
 * Movie Fragment Box - 'moof' - Container
 */
export class MovieFragmentBox extends ContainerBox<MovieFragmentHeaderBox | TrackFragmentBox> {
	constructor(boxes: (MovieFragmentHeaderBox | TrackFragmentBox)[] = []) {
		super('moof', boxes)
	}
}
