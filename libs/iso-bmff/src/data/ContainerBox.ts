import { Box } from './Box.ts'
import type { BoxType } from './BoxType.ts'


export class ContainerBox<T extends Box = Box> extends Box {
	boxes: T[]

	constructor(type: BoxType, boxes: T[] = []) {
		super(type)
		this.boxes = boxes
	}

	override get size(): number {
		// 8 (box header) + sum of child box sizes
		let size = 8

		for (const box of this.boxes) {
			size += box.size
		}

		return size
	}
}
