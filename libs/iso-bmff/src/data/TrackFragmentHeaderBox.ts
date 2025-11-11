import type { IsoView } from '../IsoView.ts'
import { writeFullBoxHeader } from '../writers/writeFullBox.ts'
import { writeString } from '../writers/writeString.ts'
import { writeUint } from '../writers/writeUint.ts'
import { FullBox } from './FullBox.ts'

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
	 * Writes a TrackFragmentHeaderBox to a DataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.8.7 Track Fragment Header Box
	 */
	static write(box: TrackFragmentHeaderBox, dataView: DataView, offset: number = 0): number {
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

		// Write optional fields based on flags
		if (box.flags & 0x01 && box.baseDataOffset !== undefined) {
			writeUint(dataView, cursor, 8, box.baseDataOffset)
			cursor += 8
		}
		if (box.flags & 0x02 && box.sampleDescriptionIndex !== undefined) {
			writeUint(dataView, cursor, 4, box.sampleDescriptionIndex)
			cursor += 4
		}
		if (box.flags & 0x08 && box.defaultSampleDuration !== undefined) {
			writeUint(dataView, cursor, 4, box.defaultSampleDuration)
			cursor += 4
		}
		if (box.flags & 0x10 && box.defaultSampleSize !== undefined) {
			writeUint(dataView, cursor, 4, box.defaultSampleSize)
			cursor += 4
		}
		if (box.flags & 0x20 && box.defaultSampleFlags !== undefined) {
			writeUint(dataView, cursor, 4, box.defaultSampleFlags)
			cursor += 4
		}

		return cursor - bufferOffset
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
