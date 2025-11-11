import type { IsoView } from '../IsoView.ts'
import { writeFullBoxHeader } from '../writers/writeFullBox.ts'
import { writeString } from '../writers/writeString.ts'
import { writeUint } from '../writers/writeUint.ts'
import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.6.1.2 Decoding Time To Sample Box
 */
export type DecodingTimeSample = {
	sampleCount: number
	sampleDelta: number
}

export class DecodingTimeToSampleBox extends FullBox {
	static readonly type = 'stts'

	/**
	 * Reads a DecodingTimeToSampleBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.6.1.2 Decoding Time To Sample Box
	 */
	static read(view: IsoView): DecodingTimeToSampleBox {
		const { version, flags } = view.readFullBox()
		const entryCount = view.readUint(4)
		const entries = view.readEntries(entryCount, () => ({
			sampleCount: view.readUint(4),
			sampleDelta: view.readUint(4),
		}))
		return new DecodingTimeToSampleBox(version, flags, entryCount, entries)
	}

	/**
	 * Writes a DecodingTimeToSampleBox to a DataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.6.1.2 Decoding Time To Sample Box
	 */
	static write(box: DecodingTimeToSampleBox, dataView: DataView, offset: number = 0): number {
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

		// Write entryCount (4 bytes)
		writeUint(dataView, cursor, 4, box.entryCount)
		cursor += 4

		// Write entries
		for (const entry of box.entries) {
			writeUint(dataView, cursor, 4, entry.sampleCount)
			cursor += 4
			writeUint(dataView, cursor, 4, entry.sampleDelta)
			cursor += 4
		}

		return cursor - bufferOffset
	}

	entryCount: number
	entries: DecodingTimeSample[]

	constructor(version: number, flags: number, entryCount: number, entries: DecodingTimeSample[] = []) {
		super('stts', version, flags)
		this.entryCount = entryCount
		this.entries = entries
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox) + 4 (entryCount) + (entries.length * 8)
		return 16 + (this.entries.length * 8)
	}
}
