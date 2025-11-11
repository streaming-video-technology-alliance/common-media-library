import type { IsoView } from '../IsoView.ts'
import { writeFullBoxHeader } from '../writers/writeFullBox.ts'
import { writeInt } from '../writers/writeInt.ts'
import { writeString } from '../writers/writeString.ts'
import { writeUint } from '../writers/writeUint.ts'
import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.8.8 Track Run Box
 */
export type TrackRunSample = {
	sampleDuration?: number
	sampleSize?: number
	sampleFlags?: number
	sampleCompositionTimeOffset?: number
}

export class TrackRunBox extends FullBox {
	static readonly type = 'trun'

	/**
	 * Reads a TrackRunBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.8.8 Track Run Box
	 */
	static read(view: IsoView): TrackRunBox {
		const { version, flags } = view.readFullBox()
		const sampleCount = view.readUint(4)
		let dataOffset: number | undefined
		let firstSampleFlags: number | undefined

		if (flags & 0x1) {
			dataOffset = view.readInt(4)
		}

		if (flags & 0x4) {
			firstSampleFlags = view.readUint(4)
		}

		const samples = view.readEntries<TrackRunSample>(sampleCount, () => {
			const sample: TrackRunSample = {}

			if (flags & 0x100) {
				sample.sampleDuration = view.readUint(4)
			}
			if (flags & 0x200) {
				sample.sampleSize = view.readUint(4)
			}
			if (flags & 0x400) {
				sample.sampleFlags = view.readUint(4)
			}
			if (flags & 0x800) {
				sample.sampleCompositionTimeOffset = version === 1 ? view.readInt(4) : view.readUint(4)
			}

			return sample
		})

		return new TrackRunBox(version, flags, sampleCount, samples, dataOffset, firstSampleFlags)
	}

	/**
	 * Writes a TrackRunBox to a DataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.8.8 Track Run Box
	 */
	static write(box: TrackRunBox, dataView: DataView, offset: number = 0): number {
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

		// Write sampleCount (4 bytes)
		writeUint(dataView, cursor, 4, box.sampleCount)
		cursor += 4

		// Write optional fields based on flags
		if (box.flags & 0x1 && box.dataOffset !== undefined) {
			writeInt(dataView, cursor, 4, box.dataOffset)
			cursor += 4
		}

		if (box.flags & 0x4 && box.firstSampleFlags !== undefined) {
			writeUint(dataView, cursor, 4, box.firstSampleFlags)
			cursor += 4
		}

		// Write samples
		for (const sample of box.samples) {
			if (box.flags & 0x100 && sample.sampleDuration !== undefined) {
				writeUint(dataView, cursor, 4, sample.sampleDuration)
				cursor += 4
			}
			if (box.flags & 0x200 && sample.sampleSize !== undefined) {
				writeUint(dataView, cursor, 4, sample.sampleSize)
				cursor += 4
			}
			if (box.flags & 0x400 && sample.sampleFlags !== undefined) {
				writeUint(dataView, cursor, 4, sample.sampleFlags)
				cursor += 4
			}
			if (box.flags & 0x800 && sample.sampleCompositionTimeOffset !== undefined) {
				if (box.version === 1) {
					writeInt(dataView, cursor, 4, sample.sampleCompositionTimeOffset)
				} else {
					writeUint(dataView, cursor, 4, sample.sampleCompositionTimeOffset)
				}
				cursor += 4
			}
		}

		return cursor - bufferOffset
	}

	sampleCount: number
	dataOffset?: number
	firstSampleFlags?: number
	samples: TrackRunSample[]

	constructor(
		version: number,
		flags: number,
		sampleCount: number,
		samples: TrackRunSample[] = [],
		dataOffset?: number,
		firstSampleFlags?: number
	) {
		super('trun', version, flags)
		this.sampleCount = sampleCount
		this.dataOffset = dataOffset
		this.firstSampleFlags = firstSampleFlags
		this.samples = samples
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox) + 4 (sampleCount) + optional fields + samples
		let size = 16

		if (this.dataOffset !== undefined) size += 4
		if (this.firstSampleFlags !== undefined) size += 4

		// Calculate sample size based on flags
		for (const sample of this.samples) {
			if (sample.sampleDuration !== undefined) size += 4
			if (sample.sampleSize !== undefined) size += 4
			if (sample.sampleFlags !== undefined) size += 4
			if (sample.sampleCompositionTimeOffset !== undefined) size += 4
		}

		return size
	}
}
