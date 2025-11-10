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
	static readonly type = 'urn '

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
	static write(box: DataEntryUrnBox, dataView: DataView, offset: number = 0): number {
		const bufferOffset = dataView.byteOffset + offset
		let cursor = bufferOffset

		// Write box header
		writeUint(dataView, cursor, 4, box.size)
		cursor += 4
		writeString(dataView, cursor, 4, box.type)
		cursor += 4

		// Write FullBox header
		writeFullBoxHeader(box, dataView, cursor)
		cursor += 4

		// Write name if present (null-terminated string)
		if (box.name) {
			writeTerminatedString(dataView, cursor, box.name)
			cursor += encodeText(box.name).length + 1
		}

		// Write location if present (null-terminated string)
		if (box.location) {
			writeTerminatedString(dataView, cursor, box.location)
			cursor += encodeText(box.location).length + 1
		}

		return cursor - bufferOffset
	}

	name?: string
	location?: string

	constructor(version: number, flags: number, name?: string, location?: string) {
		super('urn ', version, flags)
		this.name = name
		this.location = location
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
}
