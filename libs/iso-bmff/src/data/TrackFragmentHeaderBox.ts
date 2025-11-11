import type { IsoView } from '../IsoView.ts'
import { FullBox } from './FullBox.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.8.7 Track Fragment Header Box
 */
export class TrackFragmentHeaderBox extends FullBox {
	static readonly type = 'tfhd'

	/**
	 * Reads a TrackFragmentHeaderBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.8.7 Track Fragment Header Box
	 */
	static read(view: IsoView): TrackFragmentHeaderBox {
		const { version, flags } = view.readFullBox()
		const trackId = view.readUint(4)
		const baseDataOffset = flags & 0x01 ? view.readUint(8) : undefined
		const sampleDescriptionIndex = flags & 0x02 ? view.readUint(4) : undefined
		const defaultSampleDuration = flags & 0x08 ? view.readUint(4) : undefined
		const defaultSampleSize = flags & 0x10 ? view.readUint(4) : undefined
		const defaultSampleFlags = flags & 0x20 ? view.readUint(4) : undefined
		return new TrackFragmentHeaderBox(version, flags, trackId, baseDataOffset, sampleDescriptionIndex, defaultSampleDuration, defaultSampleSize, defaultSampleFlags)
	}

	/**
	 * Writes a TrackFragmentHeaderBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.8.7 Track Fragment Header Box
	 */
	static write(box: TrackFragmentHeaderBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		view.writeFullBoxHeader(box)
		view.writeUint(box.trackId, 4)
		if (box.flags & 0x01 && box.baseDataOffset !== undefined) {
			view.writeUint(box.baseDataOffset, 8)
		}
		if (box.flags & 0x02 && box.sampleDescriptionIndex !== undefined) {
			view.writeUint(box.sampleDescriptionIndex, 4)
		}
		if (box.flags & 0x08 && box.defaultSampleDuration !== undefined) {
			view.writeUint(box.defaultSampleDuration, 4)
		}
		if (box.flags & 0x10 && box.defaultSampleSize !== undefined) {
			view.writeUint(box.defaultSampleSize, 4)
		}
		if (box.flags & 0x20 && box.defaultSampleFlags !== undefined) {
			view.writeUint(box.defaultSampleFlags, 4)
		}
	}

	trackId: number
	baseDataOffset?: number
	sampleDescriptionIndex?: number
	defaultSampleDuration?: number
	defaultSampleSize?: number
	defaultSampleFlags?: number

	constructor(
		version: number,
		flags: number,
		trackId: number,
		baseDataOffset?: number,
		sampleDescriptionIndex?: number,
		defaultSampleDuration?: number,
		defaultSampleSize?: number,
		defaultSampleFlags?: number
	) {
		super('tfhd', version, flags)
		this.trackId = trackId
		this.baseDataOffset = baseDataOffset
		this.sampleDescriptionIndex = sampleDescriptionIndex
		this.defaultSampleDuration = defaultSampleDuration
		this.defaultSampleSize = defaultSampleSize
		this.defaultSampleFlags = defaultSampleFlags
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox) + 4 (trackId) + optional fields based on flags
		let size = 16

		if (this.baseDataOffset !== undefined) size += 8
		if (this.sampleDescriptionIndex !== undefined) size += 4
		if (this.defaultSampleDuration !== undefined) size += 4
		if (this.defaultSampleSize !== undefined) size += 4
		if (this.defaultSampleFlags !== undefined) size += 4

		return size
	}
}
