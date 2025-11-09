import { Box } from './Box.ts'
import type { BoxType } from './BoxType.ts'


export class FullBox extends Box {
	version: number
	flags: number

	constructor(type: BoxType, version: number, flags: number) {
		super(type)
		this.version = version
		this.flags = flags
	}
}
