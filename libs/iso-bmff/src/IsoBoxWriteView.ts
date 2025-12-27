import { encodeText } from '@svta/cml-utils'
import { UINT } from './fields/UINT.ts'
import type { IsoFieldTypeMap } from './IsoFieldTypeMap.ts'

export class IsoBoxWriteView {
	private dataView: DataView<ArrayBuffer>
	private cursor: number

	constructor(size: number) {
		this.dataView = new DataView(new ArrayBuffer(size))
		this.cursor = 0
	}

	get buffer(): ArrayBuffer {
		return this.dataView.buffer
	}

	get byteLength(): number {
		return this.dataView.byteLength
	}

	get byteOffset(): number {
		return this.dataView.byteOffset
	}

	writeUint(value: number, size: number): void {
		const { dataView, cursor } = this

		switch (size) {
			case 1:
				dataView.setUint8(cursor, value)
				break

			case 2:
				dataView.setUint16(cursor, value)
				break

			case 3: {
				const s1 = (value & 0xFFFF00) >> 8
				const s2 = (value & 0x0000FF)
				dataView.setUint16(cursor, s1)
				dataView.setUint8(cursor + 2, s2)
				break
			}

			case 4:
				dataView.setUint32(cursor, value)
				break

			case 8: {
				// Warning: JavaScript cannot handle 64-bit integers natively.
				// This will give unexpected results for integers >= 2^53
				const s1 = Math.floor(value / Math.pow(2, 32))
				const s2 = value - (s1 * Math.pow(2, 32))
				dataView.setUint32(cursor, s1)
				dataView.setUint32(cursor + 4, s2)
				break
			}
		}

		this.cursor += size
	}

	writeInt(value: number, size: number): void {
		const { dataView, cursor } = this

		switch (size) {
			case 1:
				dataView.setInt8(cursor, value)
				break

			case 2:
				dataView.setInt16(cursor, value)
				break

			case 4:
				dataView.setInt32(cursor, value)
				break

			case 8:
				// Warning: JavaScript cannot handle 64-bit integers natively.
				// This will give unexpected results for integers >= 2^53
				const s1 = Math.floor(value / Math.pow(2, 32))
				const s2 = value - (s1 * Math.pow(2, 32))
				dataView.setUint32(cursor, s1)
				dataView.setUint32(cursor + 4, s2)
				break
		}

		this.cursor += size
	}

	writeString(value: string): void {
		for (let c = 0, len = value.length; c < len; c++) {
			this.writeUint(value.charCodeAt(c), 1)
		}
	}

	writeTerminatedString(value: string): void {
		if (value.length === 0) {
			return
		}

		for (let c = 0, len = value.length; c < len; c++) {
			this.writeUint(value.charCodeAt(c), 1)
		}

		this.writeUint(0, 1)
	}

	writeUtf8TerminatedString(value: string): void {
		const bytes = encodeText(value)
		const uint8View = new Uint8Array(this.dataView.buffer)
		uint8View.set(bytes, this.cursor)
		this.cursor += bytes.length
		this.writeUint(0, 1) // null terminator
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

	writeTemplate(value: number, size: number): void {
		const shift = size === 4 ? 16 : 8
		const fixedPoint = Math.round(value * Math.pow(2, shift))
		this.writeUint(fixedPoint, size)
	}

	writeBoxHeader(type: string, size: number, largesize?: number): void {
		if (largesize !== undefined) {
			this.writeUint(1, 4) // size = 1 indicates largesize follows
			this.writeString(type)
			this.writeUint(largesize, 8)
		} else {
			this.writeUint(size, 4)
			this.writeString(type)
		}
	}

	// writeBoxHeader(type: string, extendedType?: number[]): void {
	// 	const { size } = box
	// 	const isLarge = size > 0xffffffff
	// 	const isExtended = box.type === 'uuid' && extendedType
	// 	let boxSize = size

	// 	if (isLarge) {
	// 		boxSize += 8
	// 	}

	// 	if (isExtended) {
	// 		boxSize += 16
	// 	}
	// 	this.writeUint(isLarge ? 1 : boxSize, 4)
	// 	this.writeString(box.type)

	// 	if (isLarge) {
	// 		this.writeUint(boxSize, 8)
	// 	}

	// 	if (isExtended) {
	// 		this.writeArray(extendedType, UINT, 1)
	// 	}
	// }

	writeFullBox(version: number, flags: number): void {
		this.writeUint(version, 1)
		this.writeUint(flags, 3)
	}
}
