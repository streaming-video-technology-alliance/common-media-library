import { TEMPLATE } from '../fields/TEMPLATE.ts'
import { UINT } from '../fields/UINT.ts'
import type { IsoView } from '../IsoView.ts'
import { writeFullBoxHeader } from '../writers/writeFullBox.ts'
import { writeInt } from '../writers/writeInt.ts'
import { writeString } from '../writers/writeString.ts'
import { writeUint } from '../writers/writeUint.ts'
import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.3.2 Track Header Box
 */
export class TrackHeaderBox extends FullBox {
	static readonly type = 'tkhd'

	/**
	 * Reads a TrackHeaderBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.3.2 Track Header Box
	 */
	static read(view: IsoView): TrackHeaderBox {
		const { version, flags } = view.readFullBox()
		const size = version === 1 ? 8 : 4
		const creationTime = view.readUint(size)
		const modificationTime = view.readUint(size)
		const trackId = view.readUint(4)
		const reserved1 = view.readUint(4)
		const duration = view.readUint(size)
		const reserved2 = view.readArray(UINT, 4, 2)
		const layer = view.readUint(2)
		const alternateGroup = view.readUint(2)
		const volume = view.readTemplate(2)
		const reserved3 = view.readUint(2)
		const matrix = view.readArray(TEMPLATE, 4, 9)
		const width = view.readTemplate(4)
		const height = view.readTemplate(4)
		return new TrackHeaderBox(version, flags, creationTime, modificationTime, trackId, reserved1, duration, reserved2, layer, alternateGroup, volume, reserved3, matrix, width, height)
	}

	override get size(): number {
		const isVersion1 = this.version === 1
		const timeSize = isVersion1 ? 8 : 4
		const durationSize = isVersion1 ? 8 : 4
		// 8 (box header) + 4 (FullBox) + timeSize + timeSize + 4 + 4 + durationSize + 8 + 2 + 2 + 2 + 2 + 36 + 8
		return 80 + timeSize + timeSize + durationSize
	}

	/**
	 * Writes a TrackHeaderBox to a DataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.3.2 Track Header Box
	 */
	static write(box: TrackHeaderBox, dataView: DataView, offset: number = 0): number {
		const bufferOffset = dataView.byteOffset + offset
		let cursor = bufferOffset

		const isVersion1 = box.version === 1
		const timeSize = isVersion1 ? 8 : 4
		const durationSize = isVersion1 ? 8 : 4

		// Write box header
		writeUint(dataView, cursor, 4, box.size)
		cursor += 4
		writeString(dataView, cursor, 4, box.type)
		cursor += 4

		// Write FullBox header
		writeFullBoxHeader(box, dataView, cursor)
		cursor += 4

		// Write fields
		writeUint(dataView, cursor, timeSize, box.creationTime)
		cursor += timeSize
		writeUint(dataView, cursor, timeSize, box.modificationTime)
		cursor += timeSize
		writeUint(dataView, cursor, 4, box.trackId)
		cursor += 4
		writeUint(dataView, cursor, 4, box.reserved1)
		cursor += 4
		writeUint(dataView, cursor, durationSize, box.duration)
		cursor += durationSize

		// Write reserved2 (8 bytes)
		for (let i = 0; i < box.reserved2.length; i++) {
			writeUint(dataView, cursor, 4, box.reserved2[i])
			cursor += 4
		}

		writeInt(dataView, cursor, 2, box.layer)
		cursor += 2
		writeInt(dataView, cursor, 2, box.alternateGroup)
		cursor += 2
		writeInt(dataView, cursor, 2, box.volume)
		cursor += 2
		writeUint(dataView, cursor, 2, box.reserved3)
		cursor += 2

		// Write matrix (36 bytes)
		for (let i = 0; i < box.matrix.length; i++) {
			writeInt(dataView, cursor, 4, box.matrix[i])
			cursor += 4
		}

		writeUint(dataView, cursor, 4, box.width)
		cursor += 4
		writeUint(dataView, cursor, 4, box.height)
		cursor += 4

		return cursor - bufferOffset
	}

	creationTime: number
	modificationTime: number
	trackId: number
	reserved1: number
	duration: number
	reserved2: number[]
	layer: number
	alternateGroup: number
	volume: number
	reserved3: number
	matrix: number[]
	width: number
	height: number

	constructor(
		version: number,
		flags: number,
		creationTime: number,
		modificationTime: number,
		trackId: number,
		reserved1: number,
		duration: number,
		reserved2: number[],
		layer: number,
		alternateGroup: number,
		volume: number,
		reserved3: number,
		matrix: number[],
		width: number,
		height: number
	) {
		super('tkhd', version, flags)
		this.creationTime = creationTime
		this.modificationTime = modificationTime
		this.trackId = trackId
		this.reserved1 = reserved1
		this.duration = duration
		this.reserved2 = reserved2
		this.layer = layer
		this.alternateGroup = alternateGroup
		this.volume = volume
		this.reserved3 = reserved3
		this.matrix = matrix
		this.width = width
		this.height = height
	}

	override get size(): number {
		const isVersion1 = this.version === 1
		const timeSize = isVersion1 ? 8 : 4
		const durationSize = isVersion1 ? 8 : 4
		// 8 (box header) + 4 (FullBox) + timeSize + timeSize + 4 + 4 + durationSize + 8 + 2 + 2 + 2 + 2 + 36 + 8
		return 80 + timeSize + timeSize + durationSize
	}
}
