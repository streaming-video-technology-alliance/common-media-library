import { encodeText } from '@svta/cml-utils'
import type { IsoView } from '../IsoView.ts'
import { writeFullBoxHeader } from '../writers/writeFullBox.ts'
import { writeString } from '../writers/writeString.ts'
import { writeUint } from '../writers/writeUint.ts'
import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:202x - 8.10.4 Track kind box
 */
export class TrackKindBox extends FullBox {
	static readonly type = 'kind'

	/**
	 * Reads a TrackKindBox from an IsoView
	 *
	 * ISO/IEC 14496-12:202x - 8.10.4 Track kind box
	 */
	static read(view: IsoView): TrackKindBox {
		const { version, flags } = view.readFullBox()
		const schemeUri = view.readUtf8(-1)
		const value = view.readUtf8(-1)
		return new TrackKindBox(version, flags, schemeUri, value)
	}

	/**
	 * Writes a TrackKindBox to a DataView
	 *
	 * ISO/IEC 14496-12:202x - 8.10.4 Track kind box
	 */
	static write(box: TrackKindBox, dataView: DataView, offset: number = 0): number {
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

		// Write schemeUri (UTF-8 null-terminated string)
		const schemeUriBytes = encodeText(box.schemeUri)
		const uint8View = new Uint8Array(dataView.buffer)
		uint8View.set(schemeUriBytes, cursor)
		cursor += schemeUriBytes.length
		writeUint(dataView, cursor, 1, 0) // null terminator
		cursor += 1

		// Write value (UTF-8 null-terminated string)
		const valueBytes = encodeText(box.value)
		uint8View.set(valueBytes, cursor)
		cursor += valueBytes.length
		writeUint(dataView, cursor, 1, 0) // null terminator
		cursor += 1

		return cursor - bufferOffset
	}

	schemeUri: string
	value: string

	constructor(version: number, flags: number, schemeUri: string, value: string) {
		super('kind', version, flags)
		this.schemeUri = schemeUri
		this.value = value
	}

	override get size(): number {
		const schemeUriBytes = encodeText(this.schemeUri)
		const valueBytes = encodeText(this.value)
		// 8 (box header) + 4 (FullBox) + schemeUriBytes.length + 1 + valueBytes.length + 1
		return 14 + schemeUriBytes.length + valueBytes.length
	}
}
