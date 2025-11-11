import { FullBox } from './FullBox.ts'
import { SampleEntryBox } from './SampleEntryBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.5.2 Sample Description Box
 */
export class SampleDescriptionBox extends FullBox {
	static readonly type = 'stsd'

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
