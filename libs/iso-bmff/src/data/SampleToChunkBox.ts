import type { IsoView } from '../IsoView.ts'
import { writeFullBoxHeader } from '../writers/writeFullBox.ts'
import { writeString } from '../writers/writeString.ts'
import { writeUint } from '../writers/writeUint.ts'
import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.6.4 Sample to Chunk Box
 */
export type SampleToChunkEntry = {
	firstChunk: number
	samplesPerChunk: number
	sampleDescriptionIndex: number
}

export class SampleToChunkBox extends FullBox {
	static readonly type = 'stsc'

	/**
	 * Reads a SampleToChunkBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.6.4 Sample to Chunk Box
	 */
	static read(view: IsoView): SampleToChunkBox {
		const { version, flags } = view.readFullBox()
		const entryCount = view.readUint(4)
		const entries = view.readEntries<SampleToChunkEntry>(entryCount, () => ({
			firstChunk: view.readUint(4),
			samplesPerChunk: view.readUint(4),
			sampleDescriptionIndex: view.readUint(4),
		}))
		return new SampleToChunkBox(version, flags, entryCount, entries)
	}

	/**
	 * Writes a SampleToChunkBox to a DataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.6.4 Sample to Chunk Box
	 */
	static write(box: SampleToChunkBox, dataView: DataView, offset: number = 0): number {
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
			writeUint(dataView, cursor, 4, entry.firstChunk)
			cursor += 4
			writeUint(dataView, cursor, 4, entry.samplesPerChunk)
			cursor += 4
			writeUint(dataView, cursor, 4, entry.sampleDescriptionIndex)
			cursor += 4
		}

		return cursor - bufferOffset
	}

	entryCount: number
	entries: SampleToChunkEntry[]

	constructor(version: number, flags: number, entryCount: number, entries: SampleToChunkEntry[] = []) {
		super('stsc', version, flags)
		this.entryCount = entryCount
		this.entries = entries
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox) + 4 (entryCount) + (entries.length * 12)
		return 16 + (this.entries.length * 12)
	}
}
