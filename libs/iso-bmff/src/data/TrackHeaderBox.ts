import { TEMPLATE } from '../fields/TEMPLATE.ts'
import { UINT } from '../fields/UINT.ts'
import type { IsoView } from '../IsoView.ts'
import { FullBox } from './FullBox.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

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

	/**
	 * Writes a TrackHeaderBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.3.2 Track Header Box
	 */
	static write(box: TrackHeaderBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		view.writeFullBoxHeader(box)
		const isVersion1 = box.version === 1
		const timeSize = isVersion1 ? 8 : 4
		const durationSize = isVersion1 ? 8 : 4
		view.writeUint(box.creationTime, timeSize)
		view.writeUint(box.modificationTime, timeSize)
		view.writeUint(box.trackId, 4)
		view.writeUint(box.reserved1, 4)
		view.writeUint(box.duration, durationSize)
		for (const value of box.reserved2) {
			view.writeUint(value, 4)
		}
		view.writeInt(box.layer, 2)
		view.writeInt(box.alternateGroup, 2)
		view.writeInt(box.volume, 2)
		view.writeUint(box.reserved3, 2)
		for (const value of box.matrix) {
			view.writeInt(value, 4)
		}
		view.writeUint(box.width, 4)
		view.writeUint(box.height, 4)
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
