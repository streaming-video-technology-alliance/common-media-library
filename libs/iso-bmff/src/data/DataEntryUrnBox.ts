import { encodeText } from '@svta/cml-utils'
import type { IsoView } from '../IsoView.ts'
import { writeFullBoxHeader } from '../writers/writeFullBox.ts'
import { writeString } from '../writers/writeString.ts'
import { writeTerminatedString } from '../writers/writeTerminatedString.ts'
import { writeUint } from '../writers/writeUint.ts'
import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.7.2.2 Data Entry URN Box
 */
export class DataEntryUrnBox extends FullBox {
	name?: string
	location?: string

	constructor(version: number, flags: number, name?: string, location?: string) {
		super('urn ', version, flags)
		this.name = name
		this.location = location
	}

	/**
	 * Reads a DataEntryUrnBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.7.2.2 Data Entry URN Box
	 */
	static read(view: IsoView): DataEntryUrnBox {
		const { version, flags } = view.readFullBox()
		const name = view.readString(-1)
		const location = view.readString(-1)
		return new DataEntryUrnBox(version, flags, name, location)
	}

	override get size(): number {
		let payloadSize = 0

		if (this.name) {
			payloadSize += encodeText(this.name).length + 1 // null-terminated
		}

		if (this.location) {
			payloadSize += encodeText(this.location).length + 1 // null-terminated
		}

		// 8 (box header) + 4 (FullBox) + payloadSize
		return 12 + payloadSize
	}

	/**
	 * Writes a DataEntryUrnBox to a DataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.7.2.2 Data Entry URN Box
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

		// Write name if present (null-terminated string)
		if (this.name) {
			writeTerminatedString(dataView, cursor, this.name)
			cursor += encodeText(this.name).length + 1
		}

		// Write location if present (null-terminated string)
		if (this.location) {
			writeTerminatedString(dataView, cursor, this.location)
			cursor += encodeText(this.location).length + 1
		}

		return cursor - bufferOffset
	}
}
