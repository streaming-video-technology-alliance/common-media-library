import type { IsoView } from '../IsoView.ts'
import { FullBox } from './FullBox.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2015 - 8.6.2 Sync Sample Box
 */
export type SyncSample = {
	sampleNumber: number
}

export class SyncSampleBox extends FullBox {
	static readonly type = 'stss'

	/**
	 * Reads a SyncSampleBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2015 - 8.6.2 Sync Sample Box
	 */
	static read(view: IsoView): SyncSampleBox {
		const { version, flags } = view.readFullBox()
		const entryCount = view.readUint(4)
		const entries = view.readEntries<SyncSample>(entryCount, () => ({
			sampleNumber: view.readUint(4),
		}))
		return new SyncSampleBox(version, flags, entryCount, entries)
	}

	/**
	 * Writes a SyncSampleBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:2015 - 8.6.2 Sync Sample Box
	 */
	static write(box: SyncSampleBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		view.writeFullBoxHeader(box)
		view.writeUint(box.entryCount, 4)
		for (const entry of box.entries) {
			view.writeUint(entry.sampleNumber, 4)
		}
	}

	entryCount: number
	entries: SyncSample[]

	constructor(version: number, flags: number, entryCount: number, entries: SyncSample[] = []) {
		super('stss', version, flags)
		this.entryCount = entryCount
		this.entries = entries
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox) + 4 (entryCount) + (entries.length * 4)
		return 16 + (this.entries.length * 4)
	}
}
