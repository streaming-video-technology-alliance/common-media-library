import { encodeText } from '@svta/cml-utils'
import type { IsoView } from '../IsoView.ts'
import { writeFullBoxHeader } from '../writers/writeFullBox.ts'
import { writeString } from '../writers/writeString.ts'
import { writeUint } from '../writers/writeUint.ts'
import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.12.5 Scheme Type Box
 */
export class SchemeTypeBox extends FullBox {
	static readonly type = 'schm'

	/**
	 * Reads a SchemeTypeBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.12.5 Scheme Type Box
	 */
	static read(view: IsoView): SchemeTypeBox {
		const { version, flags } = view.readFullBox()
		const schemeType = view.readUint(4)
		const schemeVersion = view.readUint(4)
		const schemeUri = flags & 0x000001 ? view.readString(-1) : undefined
		return new SchemeTypeBox(version, flags, schemeType, schemeVersion, schemeUri)
	}

	/**
	 * Writes a SchemeTypeBox to a DataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.12.5 Scheme Type Box
	 */
	static write(box: SchemeTypeBox, dataView: DataView, offset: number = 0): number {
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

		// Write schemeType (4 bytes)
		writeUint(dataView, cursor, 4, box.schemeType)
		cursor += 4

		// Write schemeVersion (4 bytes)
		writeUint(dataView, cursor, 4, box.schemeVersion)
		cursor += 4

		// Write schemeUri if present (null-terminated string)
		if (box.schemeUri) {
			const uriBytes = encodeText(box.schemeUri)
			const uint8View = new Uint8Array(dataView.buffer)
			uint8View.set(uriBytes, cursor)
			cursor += uriBytes.length
			writeUint(dataView, cursor, 1, 0) // null terminator
			cursor += 1
		}

		return cursor - bufferOffset
	}

	schemeType: number
	schemeVersion: number
	schemeUri?: string

	constructor(version: number, flags: number, schemeType: number, schemeVersion: number, schemeUri?: string) {
		super('schm', version, flags)
		this.schemeType = schemeType
		this.schemeVersion = schemeVersion
		this.schemeUri = schemeUri
	}

	override get size(): number {
		let size = 20 // header + FullBox + schemeType + schemeVersion

		if (this.schemeUri) {
			const uriBytes = encodeText(this.schemeUri)
			size += uriBytes.length + 1 // null-terminated
		}

		return size
	}
}
