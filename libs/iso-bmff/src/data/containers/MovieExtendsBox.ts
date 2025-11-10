import { ContainerBox } from '../ContainerBox.ts'
import type { MovieExtendsHeaderBox } from '../MovieExtendsHeaderBox.ts'
import type { TrackExtendsBox } from '../TrackExtendsBox.ts'

/**
 * Movie Extends Box - 'mvex' - Container
 */
export class MovieExtendsBox extends ContainerBox<MovieExtendsHeaderBox | TrackExtendsBox> {
	static readonly type = 'mvex'
	constructor(boxes: (MovieExtendsHeaderBox | TrackExtendsBox)[] = []) {
		super('mvex', boxes)
	}
}
