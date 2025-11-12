import type { SampleDescriptionBox } from '../boxes/SampleDescriptionBox.ts'
import type { SampleEntryBox } from '../boxes/SampleEntryBox.ts'
import type { IsoView } from '../IsoView.ts'
import { FullBoxBase } from './FullBoxBase.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'


/**
 * ISO/IEC 14496-12:2012 - 8.5.2 Sample Description Box
 */
export class stsd extends FullBoxBase<SampleDescriptionBox> {
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
		return new stsd(entryCount, entries, version, flags)
	}

	/**
	 * Writes a SampleDescriptionBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.5.2 Sample Description Box
	 */
	static write(box: SampleDescriptionBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		view.writeFullBoxHeader(box)
		view.writeUint(box.entryCount, 4)

		// Write entries (each entry is a box)
		// Note: Each specific SampleEntryBox type (e.g., VisualSampleEntry, AudioSampleEntry)
		// would need its own write method. For now, we write the basic SampleEntryBox structure.
		for (const entry of box.entries) {
			view.writeBoxHeader(entry)
			for (const value of entry.reserved1) {
				view.writeUint(value, 1)
			}
			view.writeUint(entry.dataReferenceIndex, 2)
			// Note: Specific sample entry types would have additional fields here
			// that need to be written by their respective write methods
		}
	}

	entryCount: number
	entries: SampleEntryBox[]

	constructor(entryCount: number, entries: SampleEntryBox[] = [], version?: number, flags?: number) {
		super('stsd', version, flags)
		this.entryCount = entryCount
		this.entries = entries
	}

	override get size(): number {
		// 4 (entryCount) + sum of entry sizes
		let entriesSize = 4

		for (const entry of this.entries) {
			entriesSize += entry.size
		}
		return entriesSize
	}
}
