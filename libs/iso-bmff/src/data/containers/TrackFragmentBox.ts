import { Box } from '../Box.ts'
import { ContainerBox } from '../ContainerBox.ts'
import type { TrackFragmentBaseMediaDecodeTimeBox } from '../TrackFragmentBaseMediaDecodeTimeBox.ts'
import type { TrackFragmentHeaderBox } from '../TrackFragmentHeaderBox.ts'
import type { TrackRunBox } from '../TrackRunBox.ts'

/**
 * Track Fragment Box - 'traf' - Container
 */
export class TrackFragmentBox extends ContainerBox<TrackFragmentHeaderBox | TrackFragmentBaseMediaDecodeTimeBox | TrackRunBox | Box> {
	static readonly type = 'traf'
	constructor(boxes: (TrackFragmentHeaderBox | TrackFragmentBaseMediaDecodeTimeBox | TrackRunBox | Box)[] = []) {
		super('traf', boxes)
	}
}
