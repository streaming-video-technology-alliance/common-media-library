import { writeBoxHeader } from '../writers/writeBoxHeader.ts'
import { writeFullBoxHeader } from '../writers/writeFullBox.ts'
import { writeInt } from '../writers/writeInt.ts'
import { writeString } from '../writers/writeString.ts'
import { writeTerminatedString } from '../writers/writeTerminatedString.ts'
import { writeUint } from '../writers/writeUint.ts'
import type { Box } from './Box.ts'
import type { FullBox } from './FullBox.ts'

export class IsoDataView {
	private dataView: DataView
	private cursor: number

	constructor(dataView: DataView) {
		this.dataView = dataView
		this.cursor = dataView.byteOffset
	}

	writeUint(value: number, size: number): void {
		writeUint(this.dataView, this.cursor, size, value)
		this.cursor += size
	}

	writeInt(value: number, size: number): void {
		writeInt(this.dataView, this.cursor, size, value)
		this.cursor += size
	}

	writeString(value: string): void {
		writeString(this.dataView, this.cursor, value)
		this.cursor += value.length
	}

	writeTerminatedString(value: string): void {
		writeTerminatedString(this.dataView, this.cursor, value)
		this.cursor += value.length + 1
	}

	writeBoxHeader(box: Box): void {
		writeBoxHeader(box, this.dataView, this.cursor)
		this.cursor += 8
	}

	writeFullBoxHeader(box: FullBox): void {
		writeFullBoxHeader(box, this.dataView, this.cursor)
		this.cursor += 4
	}
}
