import type { IsoView } from '../IsoView.ts'
import { FullBox } from './FullBox.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.8.12 Track Fragment Decode Time
 */
export class TrackFragmentBaseMediaDecodeTimeBox extends FullBox {
	static readonly type = 'tfdt'

	/**
	 * Reads a TrackFragmentBaseMediaDecodeTimeBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.8.12 Track Fragment Decode Time
	 */
	static read(view: IsoView): TrackFragmentBaseMediaDecodeTimeBox {
		const { version, flags } = view.readFullBox()
		const baseMediaDecodeTime = view.readUint(version === 1 ? 8 : 4)
		return new TrackFragmentBaseMediaDecodeTimeBox(version, flags, baseMediaDecodeTime)
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

	constructor(version: number, flags: number, baseMediaDecodeTime: number) {
		super('tfdt', version, flags)
		this.baseMediaDecodeTime = baseMediaDecodeTime
	}

	override get size(): number {
		const timeSize = this.version === 1 ? 8 : 4
		// 8 (box header) + 4 (FullBox) + timeSize
		return 12 + timeSize
	}
}
