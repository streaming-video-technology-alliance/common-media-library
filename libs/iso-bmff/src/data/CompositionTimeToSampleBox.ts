import type { IsoView } from '../IsoView.ts'
import { writeFullBoxHeader } from '../writers/writeFullBox.ts'
import { writeString } from '../writers/writeString.ts'
import { writeUint } from '../writers/writeUint.ts'
import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.6.1.3 Composition Time To Sample Box
 */
export type CompositionTimeToSampleEntry = {
	sampleCount: number
	sampleOffset: number
}

export class CompositionTimeToSampleBox extends FullBox {
	static readonly type = 'ctts'

	/**
	 * Reads a CompositionTimeToSampleBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.6.1.3 Composition Time To Sample Box
	 */
	static read(view: IsoView): CompositionTimeToSampleBox {
		const { version, flags } = view.readFullBox()
		const read = version === 1 ? view.readInt : view.readUint
		const entryCount = view.readUint(4)
		const entries = view.readEntries<CompositionTimeToSampleEntry>(entryCount, () => ({
			sampleCount: view.readUint(4),
			sampleOffset: read(4),
		}))
		return new CompositionTimeToSampleBox(version, entryCount, entries)
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox) + 4 (entryCount) + (entries.length * 8)
		return 16 + (this.entries.length * 8)
	}

	/**
	 * Writes a CompositionTimeToSampleBox to a DataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.6.1.3 Composition Time To Sample Box
	 */
	static write(box: CompositionTimeToSampleBox, dataView: DataView, offset: number = 0): number {
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
			writeUint(dataView, cursor, 4, entry.sampleOffset)
			cursor += 4
		}

		return cursor - bufferOffset
	}

	entryCount: number
	entries: CompositionTimeToSampleEntry[]

	constructor(version: number, entryCount: number, entries: CompositionTimeToSampleEntry[] = []) {
		super('ctts', version, 0)
		this.entryCount = entryCount
		this.entries = entries
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox) + 4 (entryCount) + (entries.length * 8)
		return 16 + (this.entries.length * 8)
	}
}

export const ctts: typeof CompositionTimeToSampleBox = CompositionTimeToSampleBox
