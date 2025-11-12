import type { Box } from '../boxes/Box.ts'
import type { BoxType } from '../boxes/BoxType.ts'
import { BoxBase } from './BoxBase.ts'


export class ContainerBoxBase<C extends Box<BoxType>, B extends Box<BoxType>> extends BoxBase<Box<BoxType>> {
	boxes: B[]

	constructor(type: C['type'], boxes: B[] = []) {
		super(type)
		this.boxes = boxes
	}

	override get size(): number {
		// sum of child box sizes
		let size = 0

		for (const box of this.boxes) {
			size += box.size
		}

		return size
	}
}
