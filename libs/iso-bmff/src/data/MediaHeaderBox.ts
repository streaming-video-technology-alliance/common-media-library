import { encodeText } from '@svta/cml-utils'
import type { IsoView } from '../IsoView.ts'
import { writeFullBoxHeader } from '../writers/writeFullBox.ts'
import { writeString } from '../writers/writeString.ts'
import { writeUint } from '../writers/writeUint.ts'
import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.4.2 Media Header Box
 */
export class MediaHeaderBox extends FullBox {
	creationTime: number
	modificationTime: number
	timescale: number
	duration: number
	language: string
	preDefined: number

	constructor(
		version: number,
		flags: number,
		creationTime: number,
		modificationTime: number,
		timescale: number,
		duration: number,
		language: string,
		preDefined: number
	) {
		super('mdhd', version, flags)
		this.creationTime = creationTime
		this.modificationTime = modificationTime
		this.timescale = timescale
		this.duration = duration
		this.language = language
		this.preDefined = preDefined
	}

	/**
	 * Reads a MediaHeaderBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.4.2 Media Header Box
	 */
	static read(view: IsoView): MediaHeaderBox {
		const { version, flags } = view.readFullBox()
		const creationTime = view.readUint(version == 1 ? 8 : 4)
		const modificationTime = view.readUint(version == 1 ? 8 : 4)
		const timescale = view.readUint(4)
		const duration = view.readUint(version == 1 ? 8 : 4)
		const lang = view.readUint(2)
		const language = String.fromCharCode(((lang >> 10) & 0x1F) + 0x60,
			((lang >> 5) & 0x1F) + 0x60,
			(lang & 0x1F) + 0x60)
		const preDefined = view.readUint(2)
		return new MediaHeaderBox(version, flags, creationTime, modificationTime, timescale, duration, language, preDefined)
	}

	override get size(): number {
		const isVersion1 = this.version === 1
		const timeSize = isVersion1 ? 8 : 4
		const durationSize = isVersion1 ? 8 : 4
		// 8 (box header) + 4 (FullBox) + timeSize + timeSize + 4 + durationSize + 2 + 2
		return 8 + 4 + timeSize + timeSize + 4 + durationSize + 2 + 2
	}

	/**
	 * Writes a MediaHeaderBox to a DataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.4.2 Media Header Box
	 */
	write(dataView: DataView, offset: number = 0): number {
		const bufferOffset = dataView.byteOffset + offset
		let cursor = bufferOffset

		const isVersion1 = this.version === 1
		const timeSize = isVersion1 ? 8 : 4
		const durationSize = isVersion1 ? 8 : 4

		// Write box header
		writeUint(dataView, cursor, 4, this.size)
		cursor += 4
		writeString(dataView, cursor, 4, this.type)
		cursor += 4

		// Write FullBox header
		writeFullBoxHeader(this, dataView, cursor)
		cursor += 4

		// Write fields
		writeUint(dataView, cursor, timeSize, this.creationTime)
		cursor += timeSize
		writeUint(dataView, cursor, timeSize, this.modificationTime)
		cursor += timeSize
		writeUint(dataView, cursor, 4, this.timescale)
		cursor += 4
		writeUint(dataView, cursor, durationSize, this.duration)
		cursor += durationSize

		// Write language (2 bytes) - ISO 639-2/T language code
		const langBytes = encodeText(this.language)
		writeUint(dataView, cursor, 1, langBytes.length > 0 ? langBytes[0] : 0)
		cursor += 1
		writeUint(dataView, cursor, 1, langBytes.length > 1 ? langBytes[1] : 0)
		cursor += 1

		writeUint(dataView, cursor, 2, this.preDefined)
		cursor += 2

		return cursor - bufferOffset
	}
}

