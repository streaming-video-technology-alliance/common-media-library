import type { IsoView } from '../IsoView.ts'
import { writeFullBoxHeader } from '../writers/writeFullBox.ts'
import { writeString } from '../writers/writeString.ts'
import { writeUint } from '../writers/writeUint.ts'
import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2015 - 8.6.2 Sync Sample Box
 */
export type SyncSample = {
	sampleNumber: number
}

export class SyncSampleBox extends FullBox {
	static readonly type = 'stss'

	/**
	 * Reads a SyncSampleBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2015 - 8.6.2 Sync Sample Box
	 */
	static read(view: IsoView): SyncSampleBox {
		const { version, flags } = view.readFullBox()
		const entryCount = view.readUint(4)
		const entries = view.readEntries<SyncSample>(entryCount, () => ({
			sampleNumber: view.readUint(4),
		}))
		return new SyncSampleBox(version, flags, entryCount, entries)
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox) + 4 (entryCount) + (entries.length * 4)
		return 16 + (this.entries.length * 4)
	}

	/**
	 * Writes a SyncSampleBox to a DataView
	 *
	 * ISO/IEC 14496-12:2015 - 8.6.2 Sync Sample Box
	 */
	static write(box: SyncSampleBox, dataView: DataView, offset: number = 0): number {
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
			writeUint(dataView, cursor, 4, entry.sampleNumber)
			cursor += 4
		}

		return cursor - bufferOffset
	}

	entryCount: number
	entries: SyncSample[]

	constructor(version: number, flags: number, entryCount: number, entries: SyncSample[] = []) {
		super('stss', version, flags)
		this.entryCount = entryCount
		this.entries = entries
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox) + 4 (entryCount) + (entries.length * 4)
		return 16 + (this.entries.length * 4)
	}
}
