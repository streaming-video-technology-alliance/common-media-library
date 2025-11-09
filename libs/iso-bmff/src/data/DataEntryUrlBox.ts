import { encodeText } from '@svta/cml-utils'
import type { IsoView } from '../IsoView.ts'
import { writeFullBoxHeader } from '../writers/writeFullBox.ts'
import { writeString } from '../writers/writeString.ts'
import { writeTerminatedString } from '../writers/writeTerminatedString.ts'
import { writeUint } from '../writers/writeUint.ts'
import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.7.2.1 Data Entry URL Box
 */
export class DataEntryUrlBox extends FullBox {
	location?: string

	constructor(version: number, flags: number, location?: string) {
		super('url ', version, flags)
		this.location = location
	}

	/**
	 * Reads a DataEntryUrlBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.7.2.1 Data Entry URL Box
	 */
	static read(view: IsoView): DataEntryUrlBox {
		const { version, flags } = view.readFullBox()
		const location = view.readString(-1)
		return new DataEntryUrlBox(version, flags, location)
	}

	override get size(): number {
		let payloadSize = 0
		if (this.location) {
			payloadSize = encodeText(this.location).length + 1 // null-terminated
		}
		// 8 (box header) + 4 (FullBox) + payloadSize
		return 12 + payloadSize
	}

	/**
	 * Writes a DataEntryUrlBox to a DataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.7.2.1 Data Entry URL Box
	 */
	write(dataView: DataView, offset: number = 0): number {
		const bufferOffset = dataView.byteOffset + offset
		let cursor = bufferOffset

		// Write box header
		writeUint(dataView, cursor, 4, this.size)
		cursor += 4
		writeString(dataView, cursor, 4, this.type)
		cursor += 4

		// Write FullBox header
		writeFullBoxHeader(this, dataView, cursor)
		cursor += 4

		// Write location if present (null-terminated string)
		if (this.location) {
			writeTerminatedString(dataView, cursor, this.location)
			cursor += encodeText(this.location).length + 1
		}

		return cursor - bufferOffset
	}
}

