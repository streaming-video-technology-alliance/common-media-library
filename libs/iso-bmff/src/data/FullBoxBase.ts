import type { BoxType } from '../boxes/BoxType.ts'
import type { FullBox } from '../boxes/FullBox.ts'
import { BoxBase } from './BoxBase.ts'

export class FullBoxBase<B extends FullBox<BoxType>> extends BoxBase<B> {
	version: number
	flags: number

	constructor(type: B['type'], version: number = 0, flags: number = 0) {
		super(type)
		this.version = version
		this.flags = flags
	}
}
