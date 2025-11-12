import type { MovieBox } from '../../boxes/MovieBox.ts'
import type { MovieExtendsBox } from '../../boxes/MovieExtendsBox.ts'
import type { MovieHeaderBox } from '../../boxes/MovieHeaderBox.ts'
import type { TrackBox } from '../../boxes/TrackBox.ts'
import type { UserDataBox } from '../../boxes/UserDataBox.ts'
import { ContainerBoxBase } from '../ContainerBoxBase.ts'

/**
 * Movie Box - 'moov' - Container
 */
export class moov extends ContainerBoxBase<MovieBox, MovieHeaderBox | TrackBox | MovieExtendsBox | UserDataBox> {
	static readonly type = 'moov'

	constructor(boxes: (MovieHeaderBox | TrackBox | MovieExtendsBox | UserDataBox)[] = []) {
		super('moov', boxes)
	}
}
