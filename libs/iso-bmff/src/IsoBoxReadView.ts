import type { FullBox } from './boxes/FullBox.ts'
import type { IsoBoxReadCursorState } from './cursor/IsoBoxReadCursorState.ts'
import type { IsoBoxReadCursor } from './IsoBoxReadCursor.ts'
import { DATA, INT, STRING, TEMPLATE, UINT, UTF8, type IsoBoxFields } from './IsoBoxFields.ts'
import type { IsoFieldTypeMap } from './IsoFieldTypeMap.ts'
import type { IsoInt64 } from './IsoInt64.ts'
import type { ParsedIsoBox } from './ParsedIsoBox.ts'
import { readChildBoxes } from './readChildBoxes.ts'
import { getTerminatedStringLength } from './utils/getTerminatedStringLength.ts'
import { readInt } from './utils/readInt.ts'
import { readString } from './utils/readString.ts'
import { readTemplate } from './utils/readTemplate.ts'
import { readUint } from './utils/readUint.ts'
import { readUtf8String } from './utils/readUtf8String.ts'

function limitSize(size: number, remaining: number): number {
	const limit = Math.max(remaining, 0)

	return size >= 0 && size < limit ? size : limit
}

/**
 * The version 1 read view, on a read cursor. A built-in reader that phase 3 of version 2.0.0 did not move yet
 * reads its box with this view. The view covers the bytes from `cursor.start` to `cursor.end`.
 *
 * The last pull request of phase 3 deletes the class.
 *
 * @internal
 */
export class IsoBoxReadView<V extends IsoInt64 = number> {
	private dataView: DataView
	private source: IsoBoxReadCursorState

	// The position of the view, in bytes from the start of the buffer. The position is the position of the cursor.
	private get offset(): number {
		return this.source.view.byteOffset + this.source.pos
	}

	private set offset(value: number) {
		this.source.pos = value - this.source.view.byteOffset
	}

	/**
	 * Reads an unsigned integer field of 4 or 8 bytes with the `int64` function of the cursor.
	 *
	 * @param size - The size of the field in bytes.
	 * @returns The value of the field.
	 */
	readWideUint: (size: 4 | 8) => V

	/**
	 * Reads a signed integer field of 4 or 8 bytes with the `int64` function of the cursor.
	 *
	 * @param size - The size of the field in bytes.
	 * @returns The value of the field.
	 */
	readWideInt: (size: 4 | 8) => V

	/**
	 * Creates a view of the box of a read cursor, at the position of the cursor.
	 *
	 * @param cursor - The read cursor of a reader.
	 */
	constructor(cursor: IsoBoxReadCursor<V>) {
		const source = cursor as IsoBoxReadCursorState
		const { view, start, end, int64 } = source

		this.source = source
		this.dataView = new DataView(view.buffer, view.byteOffset + start, end - start)

		if (int64) {
			this.readWideUint = size => int64(source, size, false) as V
			this.readWideInt = size => int64(source, size, true) as V
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
	 * The current byte offset in the data view.
	 */
	get cursor(): number {
		return this.offset - this.dataView.byteOffset
	}

	/**
	 * The number of bytes remaining in the data view.
	 */
	get bytesRemaining(): number {
		return this.dataView.byteLength - this.cursor
	}

	private read = <T extends IsoBoxFields>(type: T, size: number = 0): IsoFieldTypeMap[T] => {
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
			case UTF8: {
				let length = size

				if (size === -1) {
					length = getTerminatedStringLength(dataView, offset)
					cursor = length < this.bytesRemaining ? length + 1 : length
				} else if (type === UTF8) {
					cursor = length = limitSize(size, this.bytesRemaining)
				}

				result = (type === UTF8 ? readUtf8String : readString)(dataView, offset, length)
				break
			}

			case DATA: {
				const data = new Uint8Array(dataView.buffer, offset, limitSize(size, this.bytesRemaining))
				result = data
				cursor = data.length
				break
			}

			default:
				result = -1
		}

		this.offset += cursor

		return result as IsoFieldTypeMap[T]
	}

	/**
	 * Reads an unsigned integer from the data view.
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
	 * The method needs the `getBigUint64` method of `DataView`.
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
	 * @param size - The size of the data in bytes. With `-1` or a size that exceeds the bytes that remain, the method reads to the end of the view. With `0`, the method reads no bytes.
	 * @returns The data. The array shares memory with the buffer of the view.
	 *
	 * @example
	 * {@includeCode ../test/readData.test.ts#example}
	 */
	readData = (size: number): Uint8Array => {
		return this.read(DATA, size)
	}

	/**
	 * Reads a UTF-8 string from the data view.
	 *
	 * The function expects valid UTF-8. The result for bytes that are not valid UTF-8 depends on the environment,
	 * and a write of that string does not return the source bytes.
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
	 * Reads child boxes with `readChildBoxes` on the read cursor, so the readers map and the nesting limit apply.
	 *
	 * @param length - The maximum number of boxes to read. A length of 0 reads no boxes. A negative length reads every box.
	 * @returns The boxes.
	 */
	readBoxes = <T = ParsedIsoBox<V>>(length: number = -1): T[] => {
		return readChildBoxes(this.source, length < 0 ? undefined : length) as T[]
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
	}
}
