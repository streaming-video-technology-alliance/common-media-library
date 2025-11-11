import type { IsoView } from '../IsoView.ts'
import { writeFullBoxHeader } from '../writers/writeFullBox.ts'
import { writeString } from '../writers/writeString.ts'
import { writeUint } from '../writers/writeUint.ts'
import { FullBox } from './FullBox.ts'
import { SampleEntryBox } from './SampleEntryBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.5.2 Sample Description Box
 */
export class SampleDescriptionBox extends FullBox {
	static readonly type = 'stsd'

	/**
	 * Reads a SampleDescriptionBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.5.2 Sample Description Box
	 */
	static read(view: IsoView): SampleDescriptionBox {
		const { version, flags } = view.readFullBox()
		const entryCount = view.readUint(4)
		const entries = view.readBoxes<SampleEntryBox>(entryCount)
		return new SampleDescriptionBox(version, flags, entryCount, entries)
	}

	/**
	 * Writes a SampleDescriptionBox to a DataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.5.2 Sample Description Box
	 */
	static write(box: SampleDescriptionBox, dataView: DataView, offset: number = 0): number {
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

		// Write entries (each entry is a box)
		// Note: Each specific SampleEntryBox type (e.g., VisualSampleEntry, AudioSampleEntry)
		// would need its own write method. For now, we write the basic SampleEntryBox structure.
		for (const entry of box.entries) {
			// Write box header
			writeUint(dataView, cursor, 4, entry.size)
			cursor += 4
			writeString(dataView, cursor, 4, entry.type)
			cursor += 4

			// Write reserved1 (typically 6 bytes)
			for (const value of entry.reserved1) {
				writeUint(dataView, cursor, 1, value)
				cursor += 1
			}

			// Write dataReferenceIndex (2 bytes)
			writeUint(dataView, cursor, 2, entry.dataReferenceIndex)
			cursor += 2

			// Note: Specific sample entry types would have additional fields here
			// that need to be written by their respective write methods
		}

		return cursor - bufferOffset
	}

	entryCount: number
	entries: SampleEntryBox[]

	constructor(version: number, flags: number, entryCount: number, entries: SampleEntryBox[] = []) {
		super('stsd', version, flags)
		this.entryCount = entryCount
		this.entries = entries
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox) + 4 (entryCount) + sum of entry sizes
		let entriesSize = 4

		for (const entry of this.entries) {
			entriesSize += entry.size
		}
		return 12 + entriesSize
	}
}
