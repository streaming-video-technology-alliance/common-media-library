import { isArrayBufferLike } from '@svta/cml-utils'
import type { FullBox } from './boxes/FullBox.ts'
import type { IsoBox } from './IsoBox.ts'
import type { IsoBoxData } from './IsoBoxData.ts'
import { DATA, INT, STRING, TEMPLATE, UINT, UTF8, type IsoBoxFields } from './IsoBoxFields.ts'
import type { IsoBoxReadViewConfig } from './IsoBoxReadViewConfig.ts'
import type { IsoFieldTypeMap } from './IsoFieldTypeMap.ts'
import type { ParsedBox } from './ParsedBox.ts'
import type { ParsedIsoBox } from './ParsedIsoBox.ts'
import { isContainer } from './utils/isContainer.ts'
import { readData } from './utils/readData.ts'
import { readInt } from './utils/readInt.ts'
import { readString } from './utils/readString.ts'
import { readTemplate } from './utils/readTemplate.ts'
import { readTerminatedString } from './utils/readTerminatedString.ts'
import { readUint } from './utils/readUint.ts'
import { readUtf8String } from './utils/readUtf8String.ts'
import { readUtf8TerminatedString } from './utils/readUtf8TerminatedString.ts'

/**
 * ISO BMFF data view. Similar to DataView, but with additional methods for reading ISO BMFF data.
 * It implements the iterator protocol, so it can be used in a for...of loop.
 *
 * @public
 */
export class IsoBoxReadView {
	private dataView: DataView
	private offset: number
	private config: IsoBoxReadViewConfig
	private truncated: boolean = false

	/**
	 * Creates a new IsoView instance. Similar to DataView, but with additional
	 * methods for reading ISO BMFF data. It implements the iterator protocol,
	 * so it can be used in a for...of loop.
	 *
	 * @param raw - The raw data to view.
	 * @param config - The configuration for the IsoView.
	 */
	constructor(raw: IsoBoxData, config?: IsoBoxReadViewConfig) {
		this.dataView = isArrayBufferLike(raw) ? new DataView(raw) : (raw instanceof DataView) ? raw : new DataView(raw.buffer, raw.byteOffset, raw.byteLength)
		this.offset = this.dataView.byteOffset
		this.config = config || {}
	}

	/**
	 * The buffer of the data view.
	 */
	get buffer(): ArrayBufferLike {
		return this.dataView.buffer
	}

	/**
	 * The byte offset of the data view.
	 */
	get byteOffset(): number {
		return this.dataView.byteOffset
	}

	/**
	 * The byte length of the data view.
	 */
	get byteLength(): number {
		return this.dataView.byteLength
	}

	/**
	 * The current byteoffset in the data view.
	 */
	get cursor(): number {
		return this.offset - this.dataView.byteOffset
	}

	/**
	 * Whether the end of the data view has been reached.
	 */
	get done(): boolean {
		return this.cursor >= this.dataView.byteLength || this.truncated
	}

	/**
	 * The number of bytes remaining in the data view.
	 */
	get bytesRemaining(): number {
		return this.dataView.byteLength - this.cursor
	}

	/**
	 * Creates a new IsoView instance with a slice of the current data view.
	 *
	 * @param size - The size of the slice.
	 * @returns A new IsoView instance.
	 */
	slice = (offset: number, size: number): IsoBoxReadView => {
		const dataView = new DataView(this.dataView.buffer, offset, size)
		const isoView = new IsoBoxReadView(dataView, this.config)
		const headerSize = this.offset - offset
		const bodySize = size - headerSize

		this.offset += bodySize
		isoView.jump(headerSize)

		return isoView
	}

	private read = <T extends IsoBoxFields>(type: T, size: number = 0): IsoFieldTypeMap[T] => {
		// TODO: Change all sizes from bits to bytes
		const { dataView, offset } = this

		let result: any
		let cursor = size

		switch (type) {
			case UINT:
				result = readUint(dataView, offset, size)
				break

			case INT:
				result = readInt(dataView, offset, size)
				break

			case TEMPLATE:
				result = readTemplate(dataView, offset, size)
				break

			case STRING:
				if (size === -1) {
					result = readTerminatedString(dataView, offset)
					cursor = result.length + 1
				}
				else {
					result = readString(dataView, offset, size)
				}
				break

			case DATA:
				result = readData(dataView, offset, size)
				cursor = result.length
				break

			case UTF8:
				if (size === -1) {
					result = readUtf8TerminatedString(dataView, offset)
					cursor = result.length + 1
				}
				else {
					result = readUtf8String(dataView, offset)
				}
				break

			default:
				result = -1
		}

		this.offset += cursor

		return result
	}

	/**
	 * Reads a unsigned integer from the data view.
	 *
	 * @param size - The size of the integer in bytes.
	 * @returns The unsigned integer.
	 */
	readUint = (size: number): number => {
		return this.read(UINT, size)
	}

	/**
	 * Reads a signed integer from the data view.
	 *
	 * @param size - The size of the integer in bytes.
	 * @returns The signed integer.
	 */
	readInt = (size: number): number => {
		return this.read(INT, size)
	}

	/**
	 * Reads a string from the data view.
	 *
	 * @param size - The size of the string in bytes.
	 * @returns The string.
	 */
	readString = (size: number): string => {
		return this.read(STRING, size)
	}

	/**
	 * Reads a template from the data view.
	 *
	 * @param size - The size of the template in bytes.
	 * @returns The template.
	 */
	readTemplate = (size: number): number => {
		return this.read(TEMPLATE, size)
	}

	/**
	 * Reads a byte array from the data view.
	 *
	 * @param size - The size of the data in bytes.
	 * @returns The data.
	 */
	readData = (size: number): Uint8Array => {
		return this.read(DATA, size)
	}

	/**
	 * Reads a UTF-8 string from the data view.
	 *
	 * @param size - The size of the string in bytes.
	 * @returns The UTF-8 string.
	 */
	readUtf8 = (size?: number): string => {
		return this.read(UTF8, size)
	}

	/**
	 * Reads a full box from the data view.
	 *
	 * @returns The full box.
	 */
	readFullBox = (): FullBox => {
		return {
			version: this.readUint(1),
			flags: this.readUint(3),
		}
	}

	/**
	 * Reads an array of values from the data view.
	 *
	 * @param type - The type of the values.
	 * @param size - The size of the values in bytes.
	 * @param length - The number of values to read.
	 * @returns The array of values.
	 */
	readArray = <T extends keyof IsoFieldTypeMap>(type: T, size: number, length: number): IsoFieldTypeMap[T][] => {
		const value = []

		for (let i = 0; i < length; i++) {
			value.push(this.read(type, size))
		}

		return value as IsoFieldTypeMap[T][]
	}

	/**
	 * Skips a number of bytes in the view.
	 *
	 * @param size - The number of bytes to skip.
	 */
	jump = (size: number): void => {
		this.offset += size
	}

	/**
	 * Reads a raw box from the data view.
	 *
	 * @returns The box.
	 */
	readBox = (): ParsedBox => {
		const { dataView, offset } = this

		// read box size and type without advancing the cursor in case the box is truncated
		let cursor = 0
		const size = readUint(dataView, offset, 4)
		const type = readString(dataView, offset + 4, 4)
		const box = { size, type } as ParsedBox

		cursor += 8

		if (box.size === 1) {
			box.largesize = readUint(dataView, offset + cursor, 8)
			cursor += 8
		}

		const actualSize = box.size === 0 ? this.bytesRemaining : box.largesize ?? box.size
		if (this.cursor + actualSize > dataView.byteLength) {
			this.truncated = true
			throw new Error('Truncated box')
		}

		this.jump(cursor)

		if (type === 'uuid') {
			box.usertype = this.readArray('uint', 1, 16)
		}

		box.view = this.slice(offset, actualSize)

		return box
	}

	/**
	 * Reads a number of boxes from the data view.
	 *
	 * @param length - The number of boxes to read.
	 * @returns The boxes.
	 */
	readBoxes = <T = IsoBox>(length: number = -1): T[] => {
		const result: T[] = []

		for (const box of this) {
			result.push(box as T)

			if (length > 0 && result.length >= length) {
				break
			}
		}

		return result
	}

	/**
	 * Reads a number of entries from the data view.
	 *
	 * @param length - The number of entries to read.
	 * @param map - The function to map the entries.
	 * @returns The entries.
	 */
	readEntries = <T>(length: number, map: () => T): T[] => {
		const result: T[] = []

		for (let i = 0; i < length; i++) {
			result.push(map())
		}

		return result
	};

	/**
	 * Iterates over the boxes in the data view.
	 *
	 * @returns A generator of boxes.
	 */
	*[Symbol.iterator](): Generator<ParsedIsoBox> {
		const { readers = {} } = this.config

		while (!this.done) {
			try {
				const box = this.readBox() as ParsedIsoBox
				const { type, view } = box
				const parser = readers[type] || readers[type.trim()] // url and urn boxes have a trailing space in their type field

				if (parser) {
					Object.assign(box, parser(view, type))
				}

				// Some boxes, like meta, parse their child boxes themselves.
				if (isContainer(box) && !box.boxes) {
					const boxes = []

					for (const child of view) {
						boxes.push(child)
					}

					box.boxes = boxes
				}

				yield box
			}
			catch (error) {
				if (error instanceof Error && error.message === 'Truncated box') {
					break
				}

				throw error
			}
		}
	}
}
