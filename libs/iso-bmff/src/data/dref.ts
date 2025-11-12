import type { DataEntryUrlBox } from '../boxes/DataEntryUrlBox.ts'
import type { DataEntryUrnBox } from '../boxes/DataEntryUrnBox.ts'
import type { DataReferenceBox } from '../boxes/DataReferenceBox.ts'
import type { IsoView } from '../IsoView.ts'
import { FullBoxBase } from './FullBoxBase.ts'
import { IsoDataWriter } from './IsoDataWriter.ts'
import { url } from './url.ts'
import { urn } from './urn.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.7.2 Data Reference Box
 */
export class dref extends FullBoxBase<DataReferenceBox> {
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
			if (box.type === 'url') {
				entries.push(url.read(box.data))
			} else if (box.type === 'urn') {
				entries.push(urn.read(box.data))
			}
		}

		return new dref(entryCount, entries, version, flags)
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
			if (entry instanceof url) {
				url.write(entry, view)
			} else if (entry instanceof urn) {
				urn.write(entry, view)
			}
		}
	}

	entryCount: number
	entries: (DataEntryUrlBox | DataEntryUrnBox)[]

	constructor(entryCount: number, entries: (DataEntryUrlBox | DataEntryUrnBox)[] = [], version?: number, flags?: number) {
		super('dref', version, flags)
		this.entryCount = entryCount
		this.entries = entries
	}

	override get size(): number {
		// 4 (entryCount) + sum of entry sizes
		let entriesSize = 4
		for (const entry of this.entries) {
			entriesSize += entry.size
		}
		return 4 + entriesSize
	}
}
