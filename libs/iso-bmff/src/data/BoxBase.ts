import type { Box } from '../boxes/Box.ts'
import type { BoxType } from '../boxes/BoxType.ts'

export class BoxBase<B extends Box<BoxType>> {
	type: B['type']

	/**
	 * Returns the size of the box payload. This does not include the box header.
	 */
	get size(): number { // eslint-disable-line
		return 0 // 8 bytes for the box header
	}

	constructor(type: B['type']) {
		this.type = type
	}
}
