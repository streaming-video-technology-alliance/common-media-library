import type { Box } from '../../boxes/Box.ts'
import type { BoxType } from '../../boxes/BoxType.ts'
import type { TrackFragmentBaseMediaDecodeTimeBox } from '../../boxes/TrackFragmentBaseMediaDecodeTimeBox.ts'
import type { TrackFragmentBox } from '../../boxes/TrackFragmentBox.ts'
import type { TrackFragmentHeaderBox } from '../../boxes/TrackFragmentHeaderBox.ts'
import type { TrackRunBox } from '../../boxes/TrackRunBox.ts'
import { ContainerBoxBase } from '../ContainerBoxBase.ts'

/**
 * Track Fragment Box - 'traf' - Container
 */
export class traf extends ContainerBoxBase<TrackFragmentBox, TrackFragmentHeaderBox | TrackFragmentBaseMediaDecodeTimeBox | TrackRunBox | Box<BoxType>> {
	static readonly type = 'traf'

	constructor(boxes: (TrackFragmentHeaderBox | TrackFragmentBaseMediaDecodeTimeBox | TrackRunBox | Box<BoxType>)[] = []) {
		super('traf', boxes)
	}
}
