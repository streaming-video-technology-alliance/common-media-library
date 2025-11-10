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
