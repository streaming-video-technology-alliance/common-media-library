import type { IsoView } from '../IsoView.ts'
import { writeFullBoxHeader } from '../writers/writeFullBox.ts'
import { writeString } from '../writers/writeString.ts'
import { writeUint } from '../writers/writeUint.ts'
import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.8.10 Track Fragment Random Access Box
 */
export type TrackFragmentRandomAccessEntry = {
	time: number
	moofOffset: number
	trafNumber: number
	trunNumber: number
	sampleNumber: number
}

export class TrackFragmentRandomAccessBox extends FullBox {
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

		return new TrackFragmentRandomAccessBox(version, flags, trackId, reserved, numberOfEntry, lengthSizeOfTrafNum, lengthSizeOfTrunNum, lengthSizeOfSampleNum, entries)
	}

	/**
	 * Writes a TrackFragmentRandomAccessBox to a DataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.8.10 Track Fragment Random Access Box
	 */
	static write(box: TrackFragmentRandomAccessBox, dataView: DataView, offset: number = 0): number {
		const bufferOffset = dataView.byteOffset + offset
		let cursor = bufferOffset

		// Write box header
		writeUint(dataView, cursor, 4, box.size)
		cursor += 4
		writeString(dataView, cursor, 4, box.type)
		cursor += 4

		// Write FullBox header
		writeFullBoxHeader(box, dataView, cursor)
		cursor += 4

		// Write trackId (4 bytes)
		writeUint(dataView, cursor, 4, box.trackId)
		cursor += 4

		// Write reserved (4 bytes) - pack lengthSize values
		const reserved = (box.lengthSizeOfTrafNum << 4) | (box.lengthSizeOfTrunNum << 2) | box.lengthSizeOfSampleNum
		writeUint(dataView, cursor, 4, reserved)
		cursor += 4

		// Write numberOfEntry (4 bytes)
		writeUint(dataView, cursor, 4, box.numberOfEntry)
		cursor += 4

		// Write entries
		const timeSize = box.version === 1 ? 8 : 4
		for (const entry of box.entries) {
			writeUint(dataView, cursor, timeSize, entry.time)
			cursor += timeSize
			writeUint(dataView, cursor, timeSize, entry.moofOffset)
			cursor += timeSize
			writeUint(dataView, cursor, box.lengthSizeOfTrafNum + 1, entry.trafNumber)
			cursor += box.lengthSizeOfTrafNum + 1
			writeUint(dataView, cursor, box.lengthSizeOfTrunNum + 1, entry.trunNumber)
			cursor += box.lengthSizeOfTrunNum + 1
			writeUint(dataView, cursor, box.lengthSizeOfSampleNum + 1, entry.sampleNumber)
			cursor += box.lengthSizeOfSampleNum + 1
		}

		return cursor - bufferOffset
	}

	trackId: number
	reserved: number
	numberOfEntry: number
	lengthSizeOfTrafNum: number
	lengthSizeOfTrunNum: number
	lengthSizeOfSampleNum: number
	entries: TrackFragmentRandomAccessEntry[]

	constructor(
		version: number,
		flags: number,
		trackId: number,
		reserved: number,
		numberOfEntry: number,
		lengthSizeOfTrafNum: number,
		lengthSizeOfTrunNum: number,
		lengthSizeOfSampleNum: number,
		entries: TrackFragmentRandomAccessEntry[] = []
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
		// 8 (box header) + 4 (FullBox) + 4 + 4 + 4 + 1 + 1 + 1 + entries
		const entrySize = this.lengthSizeOfTrafNum + this.lengthSizeOfTrunNum + this.lengthSizeOfSampleNum + 12
		return 27 + (this.entries.length * entrySize)
	}
}
