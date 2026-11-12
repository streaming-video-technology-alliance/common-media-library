import { isArrayBufferLike } from '@svta/cml-utils'
import type { Box } from './boxes/Box.ts'
import type { FullBox } from './boxes/FullBox.ts'
import type { IsoBox } from './IsoBox.ts'
import type { IsoBoxData } from './IsoBoxData.ts'
import { DATA, INT, STRING, TEMPLATE, UINT, UTF8, type IsoBoxFields } from './IsoBoxFields.ts'
import type { IsoBoxReaderMap } from './IsoBoxReaderMap.ts'
import type { IsoBoxReadViewConfig } from './IsoBoxReadViewConfig.ts'
import type { IsoFieldTypeMap } from './IsoFieldTypeMap.ts'
import type { IsoInt64 } from './IsoInt64.ts'
import type { IsoInt64Reader } from './IsoInt64Reader.ts'
import type { ParsedBox } from './ParsedBox.ts'
import type { ParsedIsoBox } from './ParsedIsoBox.ts'
import { getTerminatedStringLength } from './utils/getTerminatedStringLength.ts'
import { isContainer } from './utils/isContainer.ts'
import { readData } from './utils/readData.ts'
import { readInt } from './utils/readInt.ts'
import { readString } from './utils/readString.ts'
import { readTemplate } from './utils/readTemplate.ts'
import { readUint } from './utils/readUint.ts'
import { readUtf8String } from './utils/readUtf8String.ts'

/**
 * ISO BMFF data view. Similar to DataView, but with additional methods for reading ISO BMFF data.
 * It implements the iterator protocol, so it can be used in a for...of loop.
 *
 * The type parameter `V` is the type of every 64-bit integer field that the built-in readers return.
 * TypeScript infers `V` from the `int64` option of the configuration.
 *
 * @public
 */
export class IsoBoxReadView<V extends IsoInt64 = number> {
	private dataView: DataView
	private offset: number
	private config: { readers?: IsoBoxReaderMap; int64?: IsoInt64Reader<V> }
	private truncated: boolean = false

	/**
	 * Reads an unsigned integer field of 4 or 8 bytes.
	 * The field is 64 bits in one version of its box.
	 *
	 * With no `int64` option, this method is the same function as `readUint`.
	 * With the option, this method returns the result of the `int64` function.
	 *
	 * @param size - The size of the field in bytes.
	 * @returns The value of the field.
	 *
	 * @example
	 * {@includeCode ../test/readWideUint.test.ts#example}
	 */
	readWideUint: (size: 4 | 8) => V

	/**
	 * Reads a signed integer field of 4 or 8 bytes.
	 * The field is 64 bits in one version of its box.
	 *
	 * With no `int64` option, this method is the same function as `readInt`.
	 * With the option, this method returns the result of the `int64` function.
	 *
	 * @param size - The size of the field in bytes.
	 * @returns The value of the field.
	 */
	readWideInt: (size: 4 | 8) => V

	/**
	 * Creates a new IsoView instance. Similar to DataView, but with additional
	 * methods for reading ISO BMFF data. It implements the iterator protocol,
	 * so it can be used in a for...of loop.
	 *
	 * @param raw - The raw data to view.
	 * @param config - The configuration for the IsoView. The configuration is required when `V` is `bigint`.
	 */
	constructor(
		raw: IsoBoxData,
		...config: [V] extends [bigint]
			? [config: IsoBoxReadViewConfig<V>]
			: [config?: IsoBoxReadViewConfig<V>]
	)
	constructor(raw: IsoBoxData, config?: IsoBoxReadView<V>['config']) {
		this.dataView = isArrayBufferLike(raw)
			? new DataView(raw)
			: raw instanceof DataView
				? raw
				: new DataView(raw.buffer, raw.byteOffset, raw.byteLength)
		this.offset = this.dataView.byteOffset
		this.config = config || {}

		const { int64 } = this.config

		if (int64) {
			this.readWideUint = size => int64(this, size, false)
			this.readWideInt = size => int64(this, size, true)
		} else {
			this.readWideUint = this.readUint as IsoBoxReadView<V>['readWideUint']
			this.readWideInt = this.readInt as IsoBoxReadView<V>['readWideInt']
		}
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
	slice = (offset: number, size: number): IsoBoxReadView<V> => {
		const dataView = new DataView(this.dataView.buffer, offset, size)
		const isoView = new IsoBoxReadView(
			dataView,
			this.config as IsoBoxReadViewConfig<IsoInt64>,
		) as IsoBoxReadView<V>
		const headerSize = this.offset - offset
		const bodySize = size - headerSize

		this.offset += bodySize
		isoView.jump(headerSize)

		return isoView
	}

	private read = <T extends IsoBoxFields>(type: T, size: number = 0): IsoFieldTypeMap[T] => {
		// TODO: Change all sizes from bits to bytes
		const { dataView, offset } = this

		let result: unknown
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
					const length = getTerminatedStringLength(dataView, offset)
					result = readString(dataView, offset, length)
					cursor = length < this.bytesRemaining ? length + 1 : length
				} else {
					result = readString(dataView, offset, size)
				}
				break

			case DATA: {
				const data = readData(dataView, offset, size)
				result = data
				cursor = data.length
				break
			}

			case UTF8:
				if (size === -1) {
					const length = getTerminatedStringLength(dataView, offset)
					result = readUtf8String(dataView, offset, length)
					cursor = length < this.bytesRemaining ? length + 1 : length
				} else {
					const remaining = Math.max(this.bytesRemaining, 0)
					cursor = size >= 0 && size < remaining ? size : remaining
					result = readUtf8String(dataView, offset, cursor)
				}
				break

			default:
				result = -1
		}

		this.offset += cursor

		return result as IsoFieldTypeMap[T]
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
	 * Reads a 64-bit unsigned integer from the data view as a `bigint`.
	 *
	 * `readUint(8)` returns a `number` and loses precision above 2^53 - 1.
	 * Use this method for a 64-bit field whose value can exceed that limit,
	 * such as `baseMediaDecodeTime` in a version 1 `tfdt` box.
	 *
	 * @returns The unsigned integer as a `bigint`.
	 *
	 * @example
	 * {@includeCode ../test/readUint64.test.ts#example}
	 */
	readUint64 = (): bigint => {
		const value = this.dataView.getBigUint64(this.cursor)
		this.offset += 8
		return value
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
	 * The method reads one character for each byte.
	 * For UTF-8 text, use `readUtf8`.
	 *
	 * @param size - The size of the string in bytes. With `-1`, the method reads to the first null byte or to the end of the view.
	 * @returns The string.
	 *
	 * @example
	 * {@includeCode ../test/readString.test.ts#example}
	 */
	readString = (size: number): string => {
		return this.read(STRING, size)
	}

	/**
	 * Reads an unsigned fixed-point value from the data view.
	 * Half of the bytes hold the integer part, and half hold the fraction.
	 *
	 * @param size - The size of the value in bytes.
	 * @returns The value.
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
	 * @param size - The size of the string in bytes. With `-1`, the method reads to the first null byte or to the end of the view. With no size, the method reads to the end of the view. With a size that exceeds the bytes that remain, the method reads to the end of the view.
	 * @returns The UTF-8 string.
	 *
	 * @example
	 * {@includeCode ../test/readUtf8.test.ts#example}
	 */
	readUtf8 = (size: number = Infinity): string => {
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
	readArray = <T extends keyof IsoFieldTypeMap>(
		type: T,
		size: number,
		length: number,
	): IsoFieldTypeMap[T][] => {
		const value = []

		for (let i = 0; i < length; i++) {
			value.push(this.read(type, size))
		}

		return value
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
	readBox = (): ParsedBox<Box, V> => {
		const { dataView, offset } = this

		// read box size and type without advancing the cursor in case the box is truncated
		let cursor = 0
		const size = readUint(dataView, offset, 4)
		const type = readString(dataView, offset + 4, 4)
		const box = { size, type } as ParsedBox<Box, V>

		cursor += 8

		if (box.size === 1) {
			box.largesize = readUint(dataView, offset + cursor, 8)
			cursor += 8
		}

		const actualSize = box.size === 0 ? this.bytesRemaining : (box.largesize ?? box.size)
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
	readBoxes = <T = IsoBox<V>>(length: number = -1): T[] => {
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
	*[Symbol.iterator](): Generator<ParsedIsoBox<V>> {
		const { readers = {} } = this.config

		while (!this.done) {
			try {
				const box = this.readBox() as ParsedIsoBox<V>
				const { type, view } = box
				const parser = readers[type] || readers[type.trim()] // url and urn boxes have a trailing space in their type field

				if (parser) {
					Object.assign(box, parser(view as IsoBoxReadView, type))
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
			} catch (error) {
				if (error instanceof Error && error.message === 'Truncated box') {
					break
				}

				throw error
			}
		}
	}
}
