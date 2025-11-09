import { ContainerBox } from '../ContainerBox.ts'
import { Box } from '../Box.ts'

/**
 * Item Reference Box - 'iref' - Container
 */
export class ItemReferenceBox extends ContainerBox<Box> {
	constructor(boxes: Box[] = []) {
		super('iref', boxes)
	}
}
