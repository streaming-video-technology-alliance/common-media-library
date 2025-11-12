import type { EditBox } from '../../boxes/EditBox.ts'
import type { MediaBox } from '../../boxes/MediaBox.ts'
import type { TrackBox } from '../../boxes/TrackBox.ts'
import type { TrackHeaderBox } from '../../boxes/TrackHeaderBox.ts'
import type { TrackReferenceBox } from '../../boxes/TrackReferenceBox.ts'
import type { UserDataBox } from '../../boxes/UserDataBox.ts'
import { ContainerBoxBase } from '../ContainerBoxBase.ts'

/**
 * Track Box - 'trak' - Container
 */
export class trak extends ContainerBoxBase<TrackBox, TrackHeaderBox | TrackReferenceBox | EditBox | MediaBox | UserDataBox> {
	static readonly type = 'trak'

	constructor(boxes: (TrackHeaderBox | TrackReferenceBox | EditBox | MediaBox | UserDataBox)[] = []) {
		super('trak', boxes)
	}
}
