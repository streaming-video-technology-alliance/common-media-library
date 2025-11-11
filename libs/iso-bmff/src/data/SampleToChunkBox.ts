import type { IsoView } from '../IsoView.ts'
import { FullBox } from './FullBox.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

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
	 * Writes a SampleToChunkBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.6.4 Sample to Chunk Box
	 */
	static write(box: SampleToChunkBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		view.writeFullBoxHeader(box)
		view.writeUint(box.entryCount, 4)
		for (const entry of box.entries) {
			view.writeUint(entry.firstChunk, 4)
			view.writeUint(entry.samplesPerChunk, 4)
			view.writeUint(entry.sampleDescriptionIndex, 4)
		}
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
