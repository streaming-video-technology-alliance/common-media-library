import type { Box } from '../../boxes/Box.ts'
import type { BoxType } from '../../boxes/BoxType.ts'
import type { ItemReferenceBox } from '../../boxes/ItemReferenceBox.ts'
import { ContainerBoxBase } from '../ContainerBoxBase.ts'

/**
 * Item Reference Box - 'iref' - Container
 */
export class iref extends ContainerBoxBase<ItemReferenceBox, Box<BoxType>> {
	static readonly type = 'iref'

	constructor(boxes: Box<BoxType>[] = []) {
		super('iref', boxes)
	}
}
