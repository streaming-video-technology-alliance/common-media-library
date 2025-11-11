import type { IsoView } from '../IsoView.ts'
import { writeFullBoxHeader } from '../writers/writeFullBox.ts'
import { writeString } from '../writers/writeString.ts'
import { writeUint } from '../writers/writeUint.ts'
import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.8.3 Track Extends Box
 */
export class TrackExtendsBox extends FullBox {
	static readonly type = 'trex'

	/**
	 * Reads a TrackExtendsBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.8.3 Track Extends Box
	 */
	static read(view: IsoView): TrackExtendsBox {
		const { version, flags } = view.readFullBox()
		const trackId = view.readUint(4)
		const defaultSampleDescriptionIndex = view.readUint(4)
		const defaultSampleDuration = view.readUint(4)
		const defaultSampleSize = view.readUint(4)
		const defaultSampleFlags = view.readUint(4)
		return new TrackExtendsBox(version, flags, trackId, defaultSampleDescriptionIndex, defaultSampleDuration, defaultSampleSize, defaultSampleFlags)
	}

	/**
	 * Writes a TrackExtendsBox to a DataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.8.3 Track Extends Box
	 */
	static write(box: TrackExtendsBox, dataView: DataView, offset: number = 0): number {
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

		// Write defaultSampleDescriptionIndex (4 bytes)
		writeUint(dataView, cursor, 4, box.defaultSampleDescriptionIndex)
		cursor += 4

		// Write defaultSampleDuration (4 bytes)
		writeUint(dataView, cursor, 4, box.defaultSampleDuration)
		cursor += 4

		// Write defaultSampleSize (4 bytes)
		writeUint(dataView, cursor, 4, box.defaultSampleSize)
		cursor += 4

		// Write defaultSampleFlags (4 bytes)
		writeUint(dataView, cursor, 4, box.defaultSampleFlags)
		cursor += 4

		return cursor - bufferOffset
	}

	trackId: number
	defaultSampleDescriptionIndex: number
	defaultSampleDuration: number
	defaultSampleSize: number
	defaultSampleFlags: number

	constructor(
		version: number,
		flags: number,
		trackId: number,
		defaultSampleDescriptionIndex: number,
		defaultSampleDuration: number,
		defaultSampleSize: number,
		defaultSampleFlags: number
	) {
		super('trex', version, flags)
		this.trackId = trackId
		this.defaultSampleDescriptionIndex = defaultSampleDescriptionIndex
		this.defaultSampleDuration = defaultSampleDuration
		this.defaultSampleSize = defaultSampleSize
		this.defaultSampleFlags = defaultSampleFlags
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox) + 4 + 4 + 4 + 4 + 4
		return 32
	}
}
