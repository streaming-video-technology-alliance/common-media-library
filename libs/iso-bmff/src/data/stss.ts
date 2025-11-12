import type { SyncSample } from '../boxes/SyncSample.ts'
import type { SyncSampleBox } from '../boxes/SyncSampleBox.ts'
import type { IsoView } from '../IsoView.ts'
import { FullBoxBase } from './FullBoxBase.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2015 - 8.6.2 Sync Sample Box
 */

export class stss extends FullBoxBase<SyncSampleBox> {
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
		return new stss(entryCount, entries, version, flags)
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

	constructor(entryCount: number, entries: SyncSample[] = [], version?: number, flags?: number) {
		super('stss', version, flags)
		this.entryCount = entryCount
		this.entries = entries
	}

	override get size(): number {
		// 4 (entryCount) + (entries.length * 4)
		return 4 + (this.entries.length * 4)
	}
}
