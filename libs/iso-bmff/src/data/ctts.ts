import type { CompositionTimeToSampleBox } from '../boxes/CompositionTimeToSampleBox.ts'
import type { CompositionTimeToSampleEntry } from '../boxes/CompositionTimeToSampleEntry.ts'
import type { Fields } from '../boxes/Fields.ts'
import type { IsoView } from '../IsoView.ts'
import { FullBoxBase } from './FullBoxBase.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.6.1.3 Composition Time To Sample Box
 */
export class ctts extends FullBoxBase<CompositionTimeToSampleBox> {
	static readonly type = 'ctts'

	/**
	 * Reads a CompositionTimeToSampleBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.6.1.3 Composition Time To Sample Box
	 */
	static read(view: IsoView): Fields<CompositionTimeToSampleBox> {
		const { version, flags } = view.readFullBox()
		const read = version === 1 ? view.readInt : view.readUint
		const entryCount = view.readUint(4)
		const entries = view.readEntries<CompositionTimeToSampleEntry>(entryCount, () => ({
			sampleCount: view.readUint(4),
			sampleOffset: read(4),
		}))
		return new ctts(entryCount, entries, version, flags)
	}

	/**
	 * Writes a CompositionTimeToSampleBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.6.1.3 Composition Time To Sample Box
	 */
	static write(box: CompositionTimeToSampleBox, view: IsoDataWriter): void {
		view.writeFullBoxHeader(box)
		view.writeUint(box.entryCount, 4)

		const write = box.version === 1 ? view.writeInt : view.writeUint
		for (const entry of box.entries) {
			write(entry.sampleCount, 4)
			write(entry.sampleOffset, 4)
		}
	}

	entryCount: number
	entries: CompositionTimeToSampleEntry[]

	constructor(entryCount: number, entries: CompositionTimeToSampleEntry[] = [], version?: number, flags?: number) {
		super('ctts', version, flags)
		this.entryCount = entryCount
		this.entries = entries
	}

	override get size(): number {
		// 4 (entryCount) + (entries.length * 8)
		return 4 + (this.entries.length * 8)
	}
}
