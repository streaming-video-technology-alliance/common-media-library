import type { IsoView } from '../IsoView.ts'
import { FullBox } from './FullBox.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.4.2 Media Header Box
 */
export class MediaHeaderBox extends FullBox {
	static readonly type = 'mdhd'

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

	/**
	 * Writes a MediaHeaderBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.4.2 Media Header Box
	 */
	static write(box: MediaHeaderBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		view.writeFullBoxHeader(box)
		const isVersion1 = box.version === 1
		const timeSize = isVersion1 ? 8 : 4
		const durationSize = isVersion1 ? 8 : 4
		view.writeUint(box.creationTime, timeSize)
		view.writeUint(box.modificationTime, timeSize)
		view.writeUint(box.timescale, 4)
		view.writeUint(box.duration, durationSize)
		const langBytes = new TextEncoder().encode(box.language)
		view.writeUint(langBytes.length > 0 ? langBytes[0] : 0, 1)
		view.writeUint(langBytes.length > 1 ? langBytes[1] : 0, 1)
		view.writeUint(box.preDefined, 2)
	}

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

	override get size(): number {
		const isVersion1 = this.version === 1
		const timeSize = isVersion1 ? 8 : 4
		const durationSize = isVersion1 ? 8 : 4
		// 8 (box header) + 4 (FullBox) + timeSize + timeSize + 4 + durationSize + 2 + 2
		return 8 + 4 + timeSize + timeSize + 4 + durationSize + 2 + 2
	}
}
