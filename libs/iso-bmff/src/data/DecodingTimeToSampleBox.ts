import type { IsoView } from '../IsoView.ts'
import { FullBox } from './FullBox.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.6.1.2 Decoding Time To Sample Box
 */
export type DecodingTimeSample = {
	sampleCount: number
	sampleDelta: number
}

export class DecodingTimeToSampleBox extends FullBox {
	static readonly type = 'stts'

	/**
	 * Reads a DecodingTimeToSampleBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.6.1.2 Decoding Time To Sample Box
	 */
	static read(view: IsoView): DecodingTimeToSampleBox {
		const { version, flags } = view.readFullBox()
		const entryCount = view.readUint(4)
		const entries = view.readEntries(entryCount, () => ({
			sampleCount: view.readUint(4),
			sampleDelta: view.readUint(4),
		}))
		return new DecodingTimeToSampleBox(version, flags, entryCount, entries)
	}

	/**
	 * Writes a DecodingTimeToSampleBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.6.1.2 Decoding Time To Sample Box
	 */
	static write(box: DecodingTimeToSampleBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		view.writeFullBoxHeader(box)
		view.writeUint(box.entryCount, 4)
		for (const entry of box.entries) {
			view.writeUint(entry.sampleCount, 4)
			view.writeUint(entry.sampleDelta, 4)
		}
	}

	entryCount: number
	entries: DecodingTimeSample[]

	constructor(version: number, flags: number, entryCount: number, entries: DecodingTimeSample[] = []) {
		super('stts', version, flags)
		this.entryCount = entryCount
		this.entries = entries
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox) + 4 (entryCount) + (entries.length * 8)
		return 16 + (this.entries.length * 8)
	}
}
