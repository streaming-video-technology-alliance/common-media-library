import type { BoxType } from './BoxType.ts'

export class Box {
	type: BoxType

	// eslint-disable-next-line
	get size(): number {
		return 8 // 8 bytes for the box header
	}

	constructor(type: BoxType) {
		this.type = type
	}
}
