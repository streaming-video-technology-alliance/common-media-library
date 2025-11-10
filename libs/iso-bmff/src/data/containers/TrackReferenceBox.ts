import { Box } from '../Box.ts'
import { ContainerBox } from '../ContainerBox.ts'

/**
 * Track Reference Box - 'tref' - Container
 */
export class TrackReferenceBox extends ContainerBox<Box> {
	static readonly type = 'tref'
	constructor(boxes: Box[] = []) {
		super('tref', boxes)
	}
}
