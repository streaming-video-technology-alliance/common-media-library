import { encodeText } from '@svta/cml-utils'
import type { Box } from '../boxes/Box.ts'
import type { BoxType } from '../boxes/BoxType.ts'
import type { FullBox } from '../boxes/FullBox.ts'
import { UINT } from '../fields/UINT.ts'
import type { IsoFieldTypeMap } from '../readers/IsoFieldTypeMap.ts'
import { writeInt } from '../writers/writeInt.ts'
import { writeString } from '../writers/writeString.ts'
import { writeTerminatedString } from '../writers/writeTerminatedString.ts'
import { writeUint } from '../writers/writeUint.ts'
import type { BoxBase } from './BoxBase.ts'

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

	writeBoxHeader(box: BoxBase<Box<BoxType>>, extendedType?: number[]): void {
		const { size } = box
		const isLarge = size > 0xffffffff
		const isExtended = box.type === 'uuid' && extendedType
		let boxSize = size

		if (isLarge) {
			boxSize += 8
		}

		if (isExtended) {
			boxSize += 16
		}
		this.writeUint(isLarge ? 1 : boxSize, 4)
		this.writeString(box.type)

		if (isLarge) {
			this.writeUint(boxSize, 8)
		}

		if (isExtended) {
			this.writeArray(extendedType, UINT, 1)
		}
	}

	writeFullBoxHeader(box: FullBox<BoxType>, extendedType?: number[]): void {
		this.writeBoxHeader(box, extendedType)
		this.writeUint(box.version, 1)
		this.writeUint(box.flags, 3)
	}

	writeBytes(data: Uint8Array): void {
		const uint8View = new Uint8Array(this.dataView.buffer)
		uint8View.set(data, this.cursor)
		this.cursor += data.length
	}

	writeArray<T extends keyof IsoFieldTypeMap>(data: number[], type: T, size: number): void {
		const write = type === UINT ? this.writeUint : this.writeInt
		for (const value of data) {
			write(value, size)
		}
	}
}
