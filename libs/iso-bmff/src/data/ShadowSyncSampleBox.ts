import type { IsoView } from '../IsoView.ts'
import { FullBox } from './FullBox.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.6.5 Shadow Sync Sample Box
 */
export type ShadowSyncEntry = {
	shadowedSampleNumber: number
	syncSampleNumber: number
}

export class ShadowSyncSampleBox extends FullBox {
	static readonly type = 'stsh'

	/**
	 * Reads a ShadowSyncSampleBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.6.5 Shadow Sync Sample Box
	 */
	static read(view: IsoView): ShadowSyncSampleBox {
		const { version, flags } = view.readFullBox()
		const entryCount = view.readUint(4)
		const entries = view.readEntries<ShadowSyncEntry>(entryCount, () => ({
			shadowedSampleNumber: view.readUint(4),
			syncSampleNumber: view.readUint(4),
		}))
		return new ShadowSyncSampleBox(version, flags, entryCount, entries)
	}

	/**
	 * Writes a ShadowSyncSampleBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.6.5 Shadow Sync Sample Box
	 */
	static write(box: ShadowSyncSampleBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		view.writeFullBoxHeader(box)
		view.writeUint(box.entryCount, 4)
		for (const entry of box.entries) {
			view.writeUint(entry.shadowedSampleNumber, 4)
			view.writeUint(entry.syncSampleNumber, 4)
		}
	}

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
