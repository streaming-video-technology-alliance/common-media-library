import { UINT } from '../fields/UINT.ts'
import type { IsoView } from '../IsoView.ts'
import { writeFullBoxHeader } from '../writers/writeFullBox.ts'
import { writeInt } from '../writers/writeInt.ts'
import { writeString } from '../writers/writeString.ts'
import { writeUint } from '../writers/writeUint.ts'
import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.2.2 Movie Header Box
 */
export class MovieHeaderBox extends FullBox {
	creationTime: number
	modificationTime: number
	timescale: number
	duration: number
	rate: number
	volume: number
	reserved1: number
	reserved2: number[]
	matrix: number[]
	preDefined: number[]
	nextTrackId: number

	constructor(
		version: number,
		flags: number,
		creationTime: number,
		modificationTime: number,
		timescale: number,
		duration: number,
		rate: number,
		volume: number,
		reserved1: number,
		reserved2: number[],
		matrix: number[],
		preDefined: number[],
		nextTrackId: number
	) {
		super('mvhd', version, flags)
		this.creationTime = creationTime
		this.modificationTime = modificationTime
		this.timescale = timescale
		this.duration = duration
		this.rate = rate
		this.volume = volume
		this.reserved1 = reserved1
		this.reserved2 = reserved2
		this.matrix = matrix
		this.preDefined = preDefined
		this.nextTrackId = nextTrackId
	}

	/**
	 * Reads a MovieHeaderBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.2.2 Movie Header Box
	 */
	static read(view: IsoView): MovieHeaderBox {
		const { version, flags } = view.readFullBox()
		const size = (version == 1) ? 8 : 4
		const creationTime = view.readUint(size)
		const modificationTime = view.readUint(size)
		const timescale = view.readUint(4)
		const duration = view.readUint(size)
		const rate = view.readTemplate(4)
		const volume = view.readTemplate(2)
		const reserved1 = view.readUint(2)
		const reserved2 = view.readArray(UINT, 4, 2)
		const matrix = view.readArray(UINT, 4, 9)
		const preDefined = view.readArray(UINT, 4, 6)
		const nextTrackId = view.readUint(4)
		return new MovieHeaderBox(version, flags, creationTime, modificationTime, timescale, duration, rate, volume, reserved1, reserved2, matrix, preDefined, nextTrackId)
	}

	override get size(): number {
		const isVersion1 = this.version === 1
		const timeSize = isVersion1 ? 8 : 4
		const durationSize = isVersion1 ? 8 : 4
		// 8 (box header) + 4 (FullBox) + timeSize + timeSize + 4 + durationSize + 4 + 2 + 2 + 8 + 36 + 24 + 4
		return 96 + timeSize + timeSize + durationSize
	}

	/**
	 * Writes a MovieHeaderBox to a DataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.2.2 Movie Header Box
	 */
	write(dataView: DataView, offset: number = 0): number {
		const bufferOffset = dataView.byteOffset + offset
		let cursor = bufferOffset

		const isVersion1 = this.version === 1
		const timeSize = isVersion1 ? 8 : 4
		const durationSize = isVersion1 ? 8 : 4

		// Write box size (4 bytes)
		writeUint(dataView, cursor, 4, this.size)
		cursor += 4

		// Write box type (4 bytes) - 'mvhd'
		writeString(dataView, cursor, 4, this.type)
		cursor += 4

		// Write FullBox header (version + flags)
		writeFullBoxHeader(this, dataView, cursor)
		cursor += 4

		// Write creationTime
		writeUint(dataView, cursor, timeSize, this.creationTime)
		cursor += timeSize

		// Write modificationTime
		writeUint(dataView, cursor, timeSize, this.modificationTime)
		cursor += timeSize

		// Write timescale (4 bytes)
		writeUint(dataView, cursor, 4, this.timescale)
		cursor += 4

		// Write duration
		writeUint(dataView, cursor, durationSize, this.duration)
		cursor += durationSize

		// Write rate (4 bytes, signed)
		writeInt(dataView, cursor, 4, this.rate)
		cursor += 4

		// Write volume (2 bytes, signed)
		writeInt(dataView, cursor, 2, this.volume)
		cursor += 2

		// Write reserved1 (2 bytes)
		writeUint(dataView, cursor, 2, this.reserved1)
		cursor += 2

		// Write reserved2 (8 bytes - 2 * 4 bytes)
		for (let i = 0; i < this.reserved2.length; i++) {
			writeUint(dataView, cursor, 4, this.reserved2[i])
			cursor += 4
		}

		// Write matrix (36 bytes - 9 * 4 bytes)
		for (let i = 0; i < this.matrix.length; i++) {
			writeInt(dataView, cursor, 4, this.matrix[i])
			cursor += 4
		}

		// Write preDefined (24 bytes - 6 * 4 bytes)
		for (let i = 0; i < this.preDefined.length; i++) {
			writeUint(dataView, cursor, 4, this.preDefined[i])
			cursor += 4
		}

		// Write nextTrackId (4 bytes)
		writeUint(dataView, cursor, 4, this.nextTrackId)
		cursor += 4

		return cursor - bufferOffset
	}
}

