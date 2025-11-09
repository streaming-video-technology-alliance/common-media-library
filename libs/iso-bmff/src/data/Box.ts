import type { BoxType } from './BoxType.ts'

export class Box<C extends Box<any> = Box<any>> {
	type: BoxType
	container: C | undefined

	// eslint-disable-next-line
	get size(): number {
		return 8 // 8 bytes for the box header
	}

	constructor(type: BoxType) {
		this.type = type
	}
}
