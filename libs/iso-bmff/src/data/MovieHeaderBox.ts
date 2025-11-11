import { UINT } from '../fields/UINT.ts'
import type { IsoView } from '../IsoView.ts'
import { FullBox } from './FullBox.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.2.2 Movie Header Box
 */
export class MovieHeaderBox extends FullBox {
	static readonly type = 'mvhd'

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

	/**
	 * Writes a MovieHeaderBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.2.2 Movie Header Box
	 */
	static write(box: MovieHeaderBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		view.writeFullBoxHeader(box)
		const isVersion1 = box.version === 1
		const timeSize = isVersion1 ? 8 : 4
		const durationSize = isVersion1 ? 8 : 4
		view.writeUint(box.creationTime, timeSize)
		view.writeUint(box.modificationTime, timeSize)
		view.writeUint(box.timescale, 4)
		view.writeUint(box.duration, durationSize)
		view.writeInt(box.rate, 4)
		view.writeInt(box.volume, 2)
		view.writeUint(box.reserved1, 2)
		for (const value of box.reserved2) {
			view.writeUint(value, 4)
		}
		for (const value of box.matrix) {
			view.writeInt(value, 4)
		}
		for (const value of box.preDefined) {
			view.writeUint(value, 4)
		}
		view.writeUint(box.nextTrackId, 4)
	}

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

	override get size(): number {
		const isVersion1 = this.version === 1
		const timeSize = isVersion1 ? 8 : 4
		const durationSize = isVersion1 ? 8 : 4
		// 8 (box header) + 4 (FullBox) + timeSize + timeSize + 4 + durationSize + 4 + 2 + 2 + 8 + 36 + 24 + 4
		return 96 + timeSize + timeSize + durationSize
	}
}
