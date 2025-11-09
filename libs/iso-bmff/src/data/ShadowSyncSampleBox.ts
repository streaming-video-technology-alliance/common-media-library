import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.6.5 Shadow Sync Sample Box
 */
export type ShadowSyncEntry = {
	shadowedSampleNumber: number
	syncSampleNumber: number
}

export class ShadowSyncSampleBox extends FullBox {
	entryCount: number
	entries: ShadowSyncEntry[]

	constructor(version: number, flags: number, entryCount: number, entries: ShadowSyncEntry[] = []) {
		super('stsh', version, flags)
		this.entryCount = entryCount
		this.entries = entries
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox) + 4 (entryCount) + (entries.length * 8)
		return 16 + (this.entries.length * 8)
	}
}

