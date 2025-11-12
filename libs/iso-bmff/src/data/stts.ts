import type { DecodingTimeSample } from '../boxes/DecodingTimeSample.ts'
import type { DecodingTimeToSampleBox } from '../boxes/DecodingTimeToSampleBox.ts'
import type { IsoView } from '../IsoView.ts'
import { FullBoxBase } from './FullBoxBase.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.6.1.2 Decoding Time To Sample Box
 */

export class stts extends FullBoxBase<DecodingTimeToSampleBox> {
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
		return new stts(entryCount, entries, version, flags)
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

	constructor(entryCount: number, entries: DecodingTimeSample[] = [], version?: number, flags?: number) {
		super('stts', version, flags)
		this.entryCount = entryCount
		this.entries = entries
	}

	override get size(): number {
		// 4 (entryCount) + (entries.length * 8)
		return 4 + (this.entries.length * 8)
	}
}
