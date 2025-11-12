import type { TrackFragmentBaseMediaDecodeTimeBox } from '../boxes/TrackFragmentBaseMediaDecodeTimeBox.ts'
import type { IsoView } from '../IsoView.ts'
import { FullBoxBase } from './FullBoxBase.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.8.12 Track Fragment Decode Time
 */
export class tfdt extends FullBoxBase<TrackFragmentBaseMediaDecodeTimeBox> {
	static readonly type = 'tfdt'

	/**
	 * Reads a TrackFragmentBaseMediaDecodeTimeBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.8.12 Track Fragment Decode Time
	 */
	static read(view: IsoView): TrackFragmentBaseMediaDecodeTimeBox {
		const { version, flags } = view.readFullBox()
		const baseMediaDecodeTime = view.readUint(version === 1 ? 8 : 4)
		return new tfdt(baseMediaDecodeTime, version, flags)
	}

	/**
	 * Writes a TrackFragmentBaseMediaDecodeTimeBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.8.12 Track Fragment Decode Time
	 */
	static write(box: TrackFragmentBaseMediaDecodeTimeBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		view.writeFullBoxHeader(box)
		const timeSize = box.version === 1 ? 8 : 4
		view.writeUint(box.baseMediaDecodeTime, timeSize)
	}

	baseMediaDecodeTime: number

	constructor(baseMediaDecodeTime: number, version?: number, flags?: number) {
		super('tfdt', version, flags)
		this.baseMediaDecodeTime = baseMediaDecodeTime
	}

	override get size(): number {
		const timeSize = this.version === 1 ? 8 : 4
		// timeSize
		return timeSize
	}
}
