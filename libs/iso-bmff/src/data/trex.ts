import type { TrackExtendsBox } from '../boxes/TrackExtendsBox.ts'
import type { IsoView } from '../IsoView.ts'
import { FullBoxBase } from './FullBoxBase.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.8.3 Track Extends Box
 */
export class trex extends FullBoxBase<TrackExtendsBox> {
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
		return new trex(trackId, defaultSampleDescriptionIndex, defaultSampleDuration, defaultSampleSize, defaultSampleFlags, version, flags)
	}

	/**
	 * Writes a TrackExtendsBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.8.3 Track Extends Box
	 */
	static write(box: TrackExtendsBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		view.writeFullBoxHeader(box)
		view.writeUint(box.trackId, 4)
		view.writeUint(box.defaultSampleDescriptionIndex, 4)
		view.writeUint(box.defaultSampleDuration, 4)
		view.writeUint(box.defaultSampleSize, 4)
		view.writeUint(box.defaultSampleFlags, 4)
	}

	trackId: number
	defaultSampleDescriptionIndex: number
	defaultSampleDuration: number
	defaultSampleSize: number
	defaultSampleFlags: number

	constructor(
		trackId: number,
		defaultSampleDescriptionIndex: number,
		defaultSampleDuration: number,
		defaultSampleSize: number,
		defaultSampleFlags: number,
		version?: number,
		flags?: number
	) {
		super('trex', version, flags)
		this.trackId = trackId
		this.defaultSampleDescriptionIndex = defaultSampleDescriptionIndex
		this.defaultSampleDuration = defaultSampleDuration
		this.defaultSampleSize = defaultSampleSize
		this.defaultSampleFlags = defaultSampleFlags
	}

	override get size(): number {
		// 4 (trackId) + 4 (defaultSampleDescriptionIndex) + 4 (defaultSampleDuration) + 4 (defaultSampleSize) + 4 (defaultSampleFlags)
		return 20
	}
}
