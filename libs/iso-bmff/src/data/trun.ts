import type { TrackRunBox } from '../boxes/TrackRunBox.ts'
import type { TrackRunSample } from '../boxes/TrackRunSample.ts'
import type { IsoView } from '../IsoView.ts'
import { FullBoxBase } from './FullBoxBase.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.8.8 Track Run Box
 */
export class trun extends FullBoxBase<TrackRunBox> {
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

		return new trun(sampleCount, samples, dataOffset, firstSampleFlags, version, flags)
	}

	/**
	 * Writes a TrackRunBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.8.8 Track Run Box
	 */
	static write(box: TrackRunBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		view.writeFullBoxHeader(box)
		view.writeUint(box.sampleCount, 4)
		if (box.flags & 0x1 && box.dataOffset !== undefined) {
			view.writeInt(box.dataOffset, 4)
		}
		if (box.flags & 0x4 && box.firstSampleFlags !== undefined) {
			view.writeUint(box.firstSampleFlags, 4)
		}
		for (const sample of box.samples) {
			if (box.flags & 0x100 && sample.sampleDuration !== undefined) {
				view.writeUint(sample.sampleDuration, 4)
			}
			if (box.flags & 0x200 && sample.sampleSize !== undefined) {
				view.writeUint(sample.sampleSize, 4)
			}
			if (box.flags & 0x400 && sample.sampleFlags !== undefined) {
				view.writeUint(sample.sampleFlags, 4)
			}
			if (box.flags & 0x800 && sample.sampleCompositionTimeOffset !== undefined) {
				if (box.version === 1) {
					view.writeInt(sample.sampleCompositionTimeOffset, 4)
				} else {
					view.writeUint(sample.sampleCompositionTimeOffset, 4)
				}
			}
		}
	}

	sampleCount: number
	dataOffset?: number
	firstSampleFlags?: number
	samples: TrackRunSample[]

	constructor(
		sampleCount: number,
		samples: TrackRunSample[] = [],
		dataOffset?: number,
		firstSampleFlags?: number,
		version?: number,
		flags?: number
	) {
		super('trun', version, flags)
		this.sampleCount = sampleCount
		this.dataOffset = dataOffset
		this.firstSampleFlags = firstSampleFlags
		this.samples = samples
	}

	override get size(): number {
		// 4 (sampleCount) + optional fields + samples
		let size = 4

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
