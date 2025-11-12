import type { MovieExtendsBox } from '../../boxes/MovieExtendsBox.ts'
import type { MovieExtendsHeaderBox } from '../../boxes/MovieExtendsHeaderBox.ts'
import type { TrackExtendsBox } from '../../boxes/TrackExtendsBox.ts'
import { ContainerBoxBase } from '../ContainerBoxBase.ts'

/**
 * Movie Extends Box - 'mvex' - Container
 */
export class mvex extends ContainerBoxBase<MovieExtendsBox, MovieExtendsHeaderBox | TrackExtendsBox> {
	static readonly type = 'mvex'

	constructor(boxes: (MovieExtendsHeaderBox | TrackExtendsBox)[] = []) {
		super('mvex', boxes)
	}
}
