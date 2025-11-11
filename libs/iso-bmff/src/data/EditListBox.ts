import type { IsoView } from '../IsoView.ts'
import { FullBox } from './FullBox.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

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
	 * Writes an EditListBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.6.7 Edit List Box
	 */
	static write(box: EditListBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		view.writeFullBoxHeader(box)
		view.writeUint(box.entryCount, 4)
		const v1 = box.version === 1
		const size = v1 ? 8 : 4
		for (const entry of box.entries) {
			view.writeUint(entry.segmentDuration, size)
			view.writeInt(entry.mediaTime, size)
			view.writeInt(entry.mediaRateInteger, 2)
			view.writeInt(entry.mediaRateFraction, 2)
		}
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
