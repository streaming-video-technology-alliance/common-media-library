import type { Box } from '../../boxes/Box.ts'
import type { BoxType } from '../../boxes/BoxType.ts'
import type { TrackReferenceBox } from '../../boxes/TrackReferenceBox.ts'
import { ContainerBoxBase } from '../ContainerBoxBase.ts'

/**
 * Track Reference Box - 'tref' - Container
 */
export class tref extends ContainerBoxBase<TrackReferenceBox, Box<BoxType>> {
	static readonly type = 'tref'

	constructor(boxes: Box<BoxType>[] = []) {
		super('tref', boxes)
	}
}
