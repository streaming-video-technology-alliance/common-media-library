import type { IsoView } from '../IsoView.ts'
import { writeFullBoxHeader } from '../writers/writeFullBox.ts'
import { writeString } from '../writers/writeString.ts'
import { writeUint } from '../writers/writeUint.ts'
import { FullBox } from './FullBox.ts'

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
	 * Writes a TrackFragmentBaseMediaDecodeTimeBox to a DataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.8.12 Track Fragment Decode Time
	 */
	static write(box: TrackFragmentBaseMediaDecodeTimeBox, dataView: DataView, offset: number = 0): number {
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

		// Write baseMediaDecodeTime
		const timeSize = box.version === 1 ? 8 : 4
		writeUint(dataView, cursor, timeSize, box.baseMediaDecodeTime)
		cursor += timeSize

		return cursor - bufferOffset
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
