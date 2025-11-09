import { ContainerBox } from '../ContainerBox.ts'
import type { MovieExtendsBox } from './MovieExtendsBox.ts'
import type { MovieHeaderBox } from '../MovieHeaderBox.ts'
import type { TrackBox } from './TrackBox.ts'
import type { UserDataBox } from './UserDataBox.ts'

/**
 * Movie Box - 'moov' - Container
 */
export class MovieBox extends ContainerBox<MovieHeaderBox | TrackBox | MovieExtendsBox | UserDataBox> {
	constructor(boxes: (MovieHeaderBox | TrackBox | MovieExtendsBox | UserDataBox)[] = []) {
		super('moov', boxes)
	}
}
