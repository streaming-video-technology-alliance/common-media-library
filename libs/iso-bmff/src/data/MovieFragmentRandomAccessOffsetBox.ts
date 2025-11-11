import type { IsoView } from '../IsoView.ts'
import { writeFullBoxHeader } from '../writers/writeFullBox.ts'
import { writeString } from '../writers/writeString.ts'
import { writeUint } from '../writers/writeUint.ts'
import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.8.11 Movie Fragment Random Access Box
 */
export class MovieFragmentRandomAccessOffsetBox extends FullBox {
	static readonly type = 'mfro'

	/**
	 * Reads a MovieFragmentRandomAccessOffsetBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.8.11 Movie Fragment Random Access Box
	 */
	static read(view: IsoView): MovieFragmentRandomAccessOffsetBox {
		const { version, flags } = view.readFullBox()
		const mfraSize = view.readUint(4)
		return new MovieFragmentRandomAccessOffsetBox(version, flags, mfraSize)
	}

	/**
	 * Writes a MovieFragmentRandomAccessOffsetBox to a DataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.8.11 Movie Fragment Random Access Box
	 */
	static write(box: MovieFragmentRandomAccessOffsetBox, dataView: DataView, offset: number = 0): number {
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

		// Write mfraSize (4 bytes)
		writeUint(dataView, cursor, 4, box.mfraSize)
		cursor += 4

		return cursor - bufferOffset
	}

	mfraSize: number

	constructor(version: number, flags: number, mfraSize: number) {
		super('mfro', version, flags)
		this.mfraSize = mfraSize
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox) + 4 (mfraSize)
		return 16
	}
}
