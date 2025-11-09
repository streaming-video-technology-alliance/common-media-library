import { encodeText } from '@svta/cml-utils'
import type { IsoView } from '../IsoView.ts'
import { writeFullBoxHeader } from '../writers/writeFullBox.ts'
import { writeString } from '../writers/writeString.ts'
import { writeTerminatedString } from '../writers/writeTerminatedString.ts'
import { writeUint } from '../writers/writeUint.ts'
import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:202x - 8.10.5 Label box
 */
export class LabelBox extends FullBox {
	isGroupLabel: boolean
	labelId: number
	language: string
	label: string

	constructor(version: number, flags: number, isGroupLabel: boolean, labelId: number, language: string, label: string) {
		super('labl', version, flags)
		this.isGroupLabel = isGroupLabel
		this.labelId = labelId
		this.language = language
		this.label = label
	}

	/**
	 * Reads a LabelBox from an IsoView
	 *
	 * ISO/IEC 14496-12:202x - 8.10.5 Label box
	 */
	static read(view: IsoView): LabelBox {
		const { version, flags } = view.readFullBox()
		const isGroupLabel = (flags & 0x1) !== 0
		const labelId = view.readUint(2)
		const language = view.readUtf8(-1)
		const label = view.readUtf8(-1)
		return new LabelBox(version, flags, isGroupLabel, labelId, language, label)
	}

	override get size(): number {
		const languageBytes = encodeText(this.language)
		const labelBytes = encodeText(this.label)
		// 8 (box header) + 4 (FullBox) + 1 + 4 + languageBytes.length + 1 + labelBytes.length + 1
		return 8 + 4 + 1 + 4 + languageBytes.length + 1 + labelBytes.length + 1
	}

	/**
	 * Writes a LabelBox to a DataView
	 *
	 * ISO/IEC 14496-12:202x - 8.10.5 Label box
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

		// Write isGroupLabel (1 byte) - stored as boolean, written as 0 or 1
		writeUint(dataView, cursor, 1, this.isGroupLabel ? 1 : 0)
		cursor += 1

		// Write labelId (4 bytes based on size calculation, though parser reads 2)
		writeUint(dataView, cursor, 4, this.labelId)
		cursor += 4

		// Write language (null-terminated string)
		writeTerminatedString(dataView, cursor, this.language)
		const languageBytes = encodeText(this.language)
		cursor += languageBytes.length + 1

		// Write label (null-terminated string)
		writeTerminatedString(dataView, cursor, this.label)
		const labelBytes = encodeText(this.label)
		cursor += labelBytes.length + 1

		return cursor - bufferOffset
	}
}

