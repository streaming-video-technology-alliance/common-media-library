import type { Box } from '../../boxes/Box.ts'
import type { BoxType } from '../../boxes/BoxType.ts'
import type { ItemInfoBox } from '../../boxes/ItemInfoBox.ts'
import { ContainerBoxBase } from '../ContainerBoxBase.ts'

/**
 * Item Info Box - 'iinf' - Container
 */
export class iinf extends ContainerBoxBase<ItemInfoBox, Box<BoxType>> {
	static readonly type = 'iinf'
	entryCount: number

	constructor(entryCount: number, boxes: Box<BoxType>[] = []) {
		super('iinf', boxes)
		this.entryCount = entryCount
	}

	override get size(): number {
		// 4 (entryCount) + sum of child box sizes
		let size = 4
		for (const box of this.boxes) {
			size += box.size
		}
		return size
	}
}
