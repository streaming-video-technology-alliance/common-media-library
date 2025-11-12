import type { ShadowSyncEntry } from '../boxes/ShadowSyncEntry.ts'
import type { ShadowSyncSampleBox } from '../boxes/ShadowSyncSampleBox.ts'
import type { IsoView } from '../IsoView.ts'
import { FullBoxBase } from './FullBoxBase.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.6.5 Shadow Sync Sample Box
 */
export class stsh extends FullBoxBase<ShadowSyncSampleBox> {
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
		return new stsh(entryCount, entries, version, flags)
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

	constructor(entryCount: number, entries: ShadowSyncEntry[] = [], version?: number, flags?: number) {
		super('stsh', version, flags)
		this.entryCount = entryCount
		this.entries = entries
	}

	override get size(): number {
		// 4 (entryCount) + (entries.length * 8)
		return 4 + (this.entries.length * 8)
	}
}
