import { ContainerBox } from '../ContainerBox.ts'
import { Box } from '../Box.ts'

/**
 * Item Info Box - 'iinf' - Container
 */
export class ItemInfoBox extends ContainerBox<Box> {
	static readonly type = 'iinf'
	entryCount: number

	constructor(entryCount: number, boxes: Box[] = []) {
		super('iinf', boxes)
		this.entryCount = entryCount
	}

	get size(): number {
		// 8 (box header) + 4 (entryCount) + sum of child box sizes
		let size = 8 + 4
		for (const box of this.boxes) {
			size += box.size
		}
		return size
	}
}
