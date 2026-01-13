import { encodeText } from '@svta/cml-utils'
import { TEMPLATE, UINT } from './IsoBoxFields.ts'
import type { IsoFieldTypeMap } from './IsoFieldTypeMap.ts'

/**
 * A view for writing ISO BMFF data.
 *
 * @public
 */
export class IsoBoxWriteView {
	private dataView: DataView<ArrayBuffer>
	private cursor: number

	/**
	 * Constructs a new IsoBoxWriteView.
	 *
	 * @param size - The size of the data view.
	 */
	constructor(type: string, size: number) {
		this.dataView = new DataView(new ArrayBuffer(size))
		this.cursor = 0
		this.writeBoxHeader(type, size)
	}

	/**
	 * The buffer of the data view.
	 *
	 * @returns The buffer of the data view.
	 */
	get buffer(): ArrayBuffer {
		return this.dataView.buffer
	}

	/**
	 * The length of the data view.
	 *
	 * @returns The length of the data view.
	 */
	get byteLength(): number {
		return this.dataView.byteLength
	}

	/**
	 * The offset of the data view.
	 *
	 * @returns The offset of the data view.
	 */
	get byteOffset(): number {
		return this.dataView.byteOffset
	}

	/**
	 * Writes a uint to the data view.
	 *
	 * @param value - The value to write.
	 * @param size - The size, in bytes, of the value.
	 */
	writeUint = (value: number, size: number): void => {
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

	/**
	 * Writes an int to the data view.
	 *
	 * @param value - The value to write.
	 * @param size - The size, in bytes, of the value.
	 */
	writeInt = (value: number, size: number): void => {
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

	/**
	 * Writes a string to the data view.
	 *
	 * @param value - The value to write.
	 */
	writeString = (value: string): void => {
		for (let c = 0, len = value.length; c < len; c++) {
			this.writeUint(value.charCodeAt(c), 1)
		}
	}

	/**
	 * Writes a null terminated string to the data view.
	 *
	 * @param value - The value to write.
	 */
	writeTerminatedString = (value: string): void => {
		if (value.length === 0) {
			return
		}

		for (let c = 0, len = value.length; c < len; c++) {
			this.writeUint(value.charCodeAt(c), 1)
		}

		this.writeUint(0, 1)
	}

	/**
	 * Writes a UTF-8 null terminated string to the data view.
	 *
	 * @param value - The value to write.
	 */
	writeUtf8TerminatedString = (value: string): void => {
		const bytes = encodeText(value)
		const uint8View = new Uint8Array(this.dataView.buffer)
		uint8View.set(bytes, this.cursor)
		this.cursor += bytes.length
		this.writeUint(0, 1) // null terminator
	}

	/**
	 * Writes a Uint8Array to the data view.
	 *
	 * @param data - The data to write.
	 */
	writeBytes = (data: Uint8Array | Uint8Array[]): void => {
		if (!Array.isArray(data)) {
			data = [data]
		}

		for (const bytes of data) {
			const uint8View = new Uint8Array(this.dataView.buffer)
			uint8View.set(bytes, this.cursor)
			this.cursor += bytes.length
		}
	}

	/**
	 * Writes an array of numbers to the data view.
	 *
	 * @param data - The data to write.
	 * @param type - The type of the data.
	 * @param size - The size, in bytes, of each data value.
	 * @param length - The number of values to write. (optional)
	 */
	writeArray = <T extends keyof IsoFieldTypeMap>(data: number[], type: T, size: number, length: number): void => {
		const write = type === UINT ? this.writeUint : type === TEMPLATE ? this.writeTemplate : this.writeInt

		for (let i = 0; i < length; i++) {
			write(data[i] ?? 0, size)
		}
	}

	/**
	 * Writes a template to the data view.
	 *
	 * @param value - The value to write.
	 * @param size - The size, in bytes, of the template.
	 */
	writeTemplate = (value: number, size: number): void => {
		const shift = size === 4 ? 16 : 8
		const fixedPoint = Math.round(value * Math.pow(2, shift))
		this.writeUint(fixedPoint, size)
	}

	/**
	 * Writes a box header to the data view.
	 *
	 * @param type - The type of the box.
	 * @param size - The size, in bytes, of the box.
	 */
	writeBoxHeader = (type: string, size: number): void => {
		const isLarge = size > 0xffffffff
		if (isLarge) {
			this.writeUint(1, 4) // size = 1 indicates largesize follows
			this.writeString(type)
			this.writeUint(size, 8)
		} else {
			this.writeUint(size, 4)
			this.writeString(type)
		}
	}

	/**
	 * Writes a full box header to the data view.
	 *
	 * @param version - The version of the full box.
	 * @param flags - The flags of the full box.
	 */
	writeFullBox(version: number, flags: number): void {
		this.writeUint(version, 1)
		this.writeUint(flags, 3)
	}
}
