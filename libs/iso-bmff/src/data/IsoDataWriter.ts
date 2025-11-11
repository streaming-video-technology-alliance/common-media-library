import { encodeText } from '@svta/cml-utils'
import { writeBoxHeader } from '../writers/writeBoxHeader.ts'
import { writeFullBoxHeader } from '../writers/writeFullBox.ts'
import { writeInt } from '../writers/writeInt.ts'
import { writeString } from '../writers/writeString.ts'
import { writeTerminatedString } from '../writers/writeTerminatedString.ts'
import { writeUint } from '../writers/writeUint.ts'
import type { Box } from './Box.ts'
import type { FullBox } from './FullBox.ts'

export class IsoDataWriter {
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

	writeUtf8TerminatedString(value: string): void {
		const bytes = encodeText(value)
		const uint8View = new Uint8Array(this.dataView.buffer)
		uint8View.set(bytes, this.cursor)
		this.cursor += bytes.length
		writeUint(this.dataView, this.cursor, 1, 0) // null terminator
		this.cursor += 1
	}

	writeBoxHeader(box: Box): void {
		writeBoxHeader(box, this.dataView, this.cursor)
		this.cursor += 8
	}

	writeBoxSize(size: number): void {
		writeUint(this.dataView, this.cursor, 4, size)
		this.cursor += 4
	}

	writeFullBoxHeader(box: FullBox): void {
		writeFullBoxHeader(box, this.dataView, this.cursor)
		this.cursor += 4
	}

	writeBytes(data: Uint8Array): void {
		const uint8View = new Uint8Array(this.dataView.buffer)
		uint8View.set(data, this.cursor)
		this.cursor += data.length
	}
}
