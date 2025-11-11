import type { IsoView } from '../IsoView.ts'
import { writeFullBoxHeader } from '../writers/writeFullBox.ts'
import { writeInt } from '../writers/writeInt.ts'
import { writeString } from '../writers/writeString.ts'
import { writeUint } from '../writers/writeUint.ts'
import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.6.7 Edit List Box
 */
export type EditListEntry = {
	segmentDuration: number
	mediaTime: number
	mediaRateInteger: number
	mediaRateFraction: number
}

export class EditListBox extends FullBox {
	static readonly type = 'elst'

	/**
	 * Reads an EditListBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.6.7 Edit List Box
	 */
	static read(view: IsoView): EditListBox {
		const { version, flags } = view.readFullBox()
		const v1 = version === 1
		const size = v1 ? 8 : 4
		const entryCount = view.readUint(4)
		const entries = view.readEntries<EditListEntry>(entryCount, () => ({
			segmentDuration: view.readUint(size),
			mediaTime: view.readInt(size),
			mediaRateInteger: view.readInt(2),
			mediaRateFraction: view.readInt(2),
		}))
		return new EditListBox(version, flags, entryCount, entries)
	}

	/**
	 * Writes an EditListBox to a DataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.6.7 Edit List Box
	 */
	static write(box: EditListBox, dataView: DataView, offset: number = 0): number {
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
		const v1 = box.version === 1
		const size = v1 ? 8 : 4
		for (const entry of box.entries) {
			writeUint(dataView, cursor, size, entry.segmentDuration)
			cursor += size
			writeInt(dataView, cursor, size, entry.mediaTime)
			cursor += size
			writeInt(dataView, cursor, 2, entry.mediaRateInteger)
			cursor += 2
			writeInt(dataView, cursor, 2, entry.mediaRateFraction)
			cursor += 2
		}

		return cursor - bufferOffset
	}

	entryCount: number
	entries: EditListEntry[]

	constructor(version: number, flags: number, entryCount: number, entries: EditListEntry[] = []) {
		super('elst', version, flags)
		this.entryCount = entryCount
		this.entries = entries
	}

	override get size(): number {
		const entrySize = this.version === 1 ? 20 : 12 // version 1: 8+8+2+2, version 0: 4+4+2+2
		// 8 (box header) + 4 (FullBox) + 4 (entryCount) + (entries.length * entrySize)
		return 16 + (this.entries.length * entrySize)
	}
}
