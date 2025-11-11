import { encodeText } from '@svta/cml-utils'
import type { IsoView } from '../IsoView.ts'
import { writeFullBoxHeader } from '../writers/writeFullBox.ts'
import { writeString } from '../writers/writeString.ts'
import { writeUint } from '../writers/writeUint.ts'
import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:202x - 8.4.6 Extended language tag
 */
export class ExtendedLanguageBox extends FullBox {
	static readonly type = 'elng'

	/**
	 * Reads an ExtendedLanguageBox from an IsoView
	 *
	 * ISO/IEC 14496-12:202x - 8.4.6 Extended language tag
	 */
	static read(view: IsoView): ExtendedLanguageBox {
		const { version, flags } = view.readFullBox()
		const extendedLanguage = view.readUtf8(-1)
		return new ExtendedLanguageBox(version, flags, extendedLanguage)
	}

	/**
	 * Writes an ExtendedLanguageBox to a DataView
	 *
	 * ISO/IEC 14496-12:202x - 8.4.6 Extended language tag
	 */
	static write(box: ExtendedLanguageBox, dataView: DataView, offset: number = 0): number {
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

		// Write extendedLanguage (UTF-8 null-terminated string)
		const langBytes = encodeText(box.extendedLanguage)
		const uint8View = new Uint8Array(dataView.buffer)
		uint8View.set(langBytes, cursor)
		cursor += langBytes.length
		writeUint(dataView, cursor, 1, 0) // null terminator
		cursor += 1

		return cursor - bufferOffset
	}

	extendedLanguage: string

	constructor(version: number, flags: number, extendedLanguage: string) {
		super('elng', version, flags)
		this.extendedLanguage = extendedLanguage
	}

	override get size(): number {
		const langBytes = encodeText(this.extendedLanguage)
		// 8 (box header) + 4 (FullBox) + langBytes.length + 1 (null terminator)
		return 12 + langBytes.length + 1
	}
}
