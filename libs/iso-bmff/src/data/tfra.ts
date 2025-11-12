import type { TrackFragmentRandomAccessBox } from '../boxes/TrackFragmentRandomAccessBox.ts'
import type { TrackFragmentRandomAccessEntry } from '../boxes/TrackFragmentRandomAccessEntry.ts'
import type { IsoView } from '../IsoView.ts'
import { FullBoxBase } from './FullBoxBase.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.8.10 Track Fragment Random Access Box
 */

export class tfra extends FullBoxBase<TrackFragmentRandomAccessBox> {
	static readonly type = 'tfra'

	/**
	 * Reads a TrackFragmentRandomAccessBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.8.10 Track Fragment Random Access Box
	 */
	static read(view: IsoView): TrackFragmentRandomAccessBox {
		const { version, flags } = view.readFullBox()
		const trackId = view.readUint(4)
		const reserved = view.readUint(4)

		const lengthSizeOfTrafNum = (reserved & 0x00000030) >> 4
		const lengthSizeOfTrunNum = (reserved & 0x0000000C) >> 2
		const lengthSizeOfSampleNum = reserved & 0x00000003

		const numberOfEntry = view.readUint(4)

		const entries = view.readEntries<TrackFragmentRandomAccessEntry>(numberOfEntry, () => ({
			time: view.readUint(version === 1 ? 8 : 4),
			moofOffset: view.readUint(version === 1 ? 8 : 4),
			trafNumber: view.readUint(lengthSizeOfTrafNum + 1),
			trunNumber: view.readUint(lengthSizeOfTrunNum + 1),
			sampleNumber: view.readUint(lengthSizeOfSampleNum + 1),
		}))

		return new tfra(trackId, reserved, numberOfEntry, lengthSizeOfTrafNum, lengthSizeOfTrunNum, lengthSizeOfSampleNum, entries, version, flags)
	}

	/**
	 * Writes a TrackFragmentRandomAccessBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.8.10 Track Fragment Random Access Box
	 */
	static write(box: TrackFragmentRandomAccessBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		view.writeFullBoxHeader(box)
		view.writeUint(box.trackId, 4)
		const reserved = (box.lengthSizeOfTrafNum << 4) | (box.lengthSizeOfTrunNum << 2) | box.lengthSizeOfSampleNum
		view.writeUint(reserved, 4)
		view.writeUint(box.numberOfEntry, 4)
		const timeSize = box.version === 1 ? 8 : 4
		for (const entry of box.entries) {
			view.writeUint(entry.time, timeSize)
			view.writeUint(entry.moofOffset, timeSize)
			view.writeUint(entry.trafNumber, box.lengthSizeOfTrafNum + 1)
			view.writeUint(entry.trunNumber, box.lengthSizeOfTrunNum + 1)
			view.writeUint(entry.sampleNumber, box.lengthSizeOfSampleNum + 1)
		}
	}

	trackId: number
	reserved: number
	numberOfEntry: number
	lengthSizeOfTrafNum: number
	lengthSizeOfTrunNum: number
	lengthSizeOfSampleNum: number
	entries: TrackFragmentRandomAccessEntry[]

	constructor(
		trackId: number,
		reserved: number,
		numberOfEntry: number,
		lengthSizeOfTrafNum: number,
		lengthSizeOfTrunNum: number,
		lengthSizeOfSampleNum: number,
		entries: TrackFragmentRandomAccessEntry[] = [],
		version?: number,
		flags?: number
	) {
		super('tfra', version, flags)
		this.trackId = trackId
		this.reserved = reserved
		this.numberOfEntry = numberOfEntry
		this.lengthSizeOfTrafNum = lengthSizeOfTrafNum
		this.lengthSizeOfTrunNum = lengthSizeOfTrunNum
		this.lengthSizeOfSampleNum = lengthSizeOfSampleNum
		this.entries = entries
	}

	override get size(): number {
		// 4 + 4 + 4 + 1 + 1 + 1 + entries
		const entrySize = this.lengthSizeOfTrafNum + this.lengthSizeOfTrunNum + this.lengthSizeOfSampleNum + 12
		return 15 + (this.entries.length * entrySize)
	}
}
