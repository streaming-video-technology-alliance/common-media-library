import type { IsoView } from '../IsoView.ts'
import { DataEntryUrlBox } from './DataEntryUrlBox.ts'
import { DataEntryUrnBox } from './DataEntryUrnBox.ts'
import { FullBox } from './FullBox.ts'
import { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.7.2 Data Reference Box
 */
export class DataReferenceBox extends FullBox {
	static readonly type = 'dref'

	/**
	 * Reads a DataReferenceBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.7.2 Data Reference Box
	 */
	static read(view: IsoView): DataReferenceBox {
		const { version, flags } = view.readFullBox()
		const entryCount = view.readUint(4)
		const entries: (DataEntryUrlBox | DataEntryUrnBox)[] = []
		for (let i = 0; i < entryCount; i++) {
			const box = view.readBox()
			if (box.type === 'url ') {
				entries.push(DataEntryUrlBox.read(box.data))
			} else if (box.type === 'urn ') {
				entries.push(DataEntryUrnBox.read(box.data))
			}
		}
		return new DataReferenceBox(version, flags, entryCount, entries)
	}

	/**
	 * Writes a DataReferenceBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.7.2 Data Reference Box
	 */
	static write(box: DataReferenceBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		view.writeFullBoxHeader(box)
		view.writeUint(box.entryCount, 4)
		for (const entry of box.entries) {
			if (entry instanceof DataEntryUrlBox) {
				DataEntryUrlBox.write(entry, view)
			} else if (entry instanceof DataEntryUrnBox) {
				DataEntryUrnBox.write(entry, view)
			}
		}
	}

	entryCount: number
	entries: (DataEntryUrlBox | DataEntryUrnBox)[]

	constructor(version: number, flags: number, entryCount: number, entries: (DataEntryUrlBox | DataEntryUrnBox)[] = []) {
		super('dref', version, flags)
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
