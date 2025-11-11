import type { IsoView } from '../IsoView.ts'
import { FullBox } from './FullBox.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.6.1.3 Composition Time To Sample Box
 */
export type CompositionTimeToSampleEntry = {
	sampleCount: number
	sampleOffset: number
}

export class CompositionTimeToSampleBox extends FullBox {
	static readonly type = 'ctts'

	/**
	 * Reads a CompositionTimeToSampleBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.6.1.3 Composition Time To Sample Box
	 */
	static read(view: IsoView): CompositionTimeToSampleBox {
		const { version, flags } = view.readFullBox()
		const read = version === 1 ? view.readInt : view.readUint
		const entryCount = view.readUint(4)
		const entries = view.readEntries<CompositionTimeToSampleEntry>(entryCount, () => ({
			sampleCount: view.readUint(4),
			sampleOffset: read(4),
		}))
		return new CompositionTimeToSampleBox(version, flags, entryCount, entries)
	}

	/**
	 * Writes a CompositionTimeToSampleBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.6.1.3 Composition Time To Sample Box
	 */
	static write(box: CompositionTimeToSampleBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		view.writeFullBoxHeader(box)
		view.writeUint(box.entryCount, 4)
		for (const entry of box.entries) {
			view.writeUint(entry.sampleCount, 4)
			view.writeUint(entry.sampleOffset, 4)
		}
	}

	entryCount: number
	entries: CompositionTimeToSampleEntry[]

	constructor(version: number, flags: number, entryCount: number, entries: CompositionTimeToSampleEntry[] = []) {
		super('ctts', version, flags)
		this.entryCount = entryCount
		this.entries = entries
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox) + 4 (entryCount) + (entries.length * 8)
		return 16 + (this.entries.length * 8)
	}
}
