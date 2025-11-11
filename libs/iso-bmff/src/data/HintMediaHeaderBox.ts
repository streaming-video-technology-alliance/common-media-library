import type { IsoView } from '../IsoView.ts'
import { writeFullBoxHeader } from '../writers/writeFullBox.ts'
import { writeString } from '../writers/writeString.ts'
import { writeUint } from '../writers/writeUint.ts'
import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.4.5.5 Hint Media Header Box
 */
export class HintMediaHeaderBox extends FullBox {
	static readonly type = 'hmhd'

	/**
	 * Reads a HintMediaHeaderBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.4.5.5 Hint Media Header Box
	 */
	static read(view: IsoView): HintMediaHeaderBox {
		const { version, flags } = view.readFullBox()
		const maxPDUsize = view.readUint(2)
		const avgPDUsize = view.readUint(2)
		const maxbitrate = view.readUint(4)
		const avgbitrate = view.readUint(4)
		return new HintMediaHeaderBox(version, flags, maxPDUsize, avgPDUsize, maxbitrate, avgbitrate)
	}

	/**
	 * Writes a HintMediaHeaderBox to a DataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.4.5.5 Hint Media Header Box
	 */
	static write(box: HintMediaHeaderBox, dataView: DataView, offset: number = 0): number {
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

		// Write maxPDUsize (2 bytes)
		writeUint(dataView, cursor, 2, box.maxPDUsize)
		cursor += 2

		// Write avgPDUsize (2 bytes)
		writeUint(dataView, cursor, 2, box.avgPDUsize)
		cursor += 2

		// Write maxbitrate (4 bytes)
		writeUint(dataView, cursor, 4, box.maxbitrate)
		cursor += 4

		// Write avgbitrate (4 bytes)
		writeUint(dataView, cursor, 4, box.avgbitrate)
		cursor += 4

		return cursor - bufferOffset
	}

	maxPDUsize: number
	avgPDUsize: number
	maxbitrate: number
	avgbitrate: number

	constructor(
		version: number,
		flags: number,
		maxPDUsize: number,
		avgPDUsize: number,
		maxbitrate: number,
		avgbitrate: number
	) {
		super('hmhd', version, flags)
		this.maxPDUsize = maxPDUsize
		this.avgPDUsize = avgPDUsize
		this.maxbitrate = maxbitrate
		this.avgbitrate = avgbitrate
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox) + 2 + 2 + 4 + 4
		return 24
	}
}
