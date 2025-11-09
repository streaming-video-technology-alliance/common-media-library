import { UINT } from '../fields/UINT.ts'
import type { IsoView } from '../IsoView.ts'
import { writeFullBoxHeader } from '../writers/writeFullBox.ts'
import { writeString } from '../writers/writeString.ts'
import { writeUint } from '../writers/writeUint.ts'
import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.6.3 Sample Size Box
 */
export class SampleSizeBox extends FullBox {
	sampleSize: number
	sampleCount: number
	entrySize?: number[]

	constructor(version: number, flags: number, sampleSize: number, sampleCount: number, entrySize?: number[]) {
		super('stsz', version, flags)
		this.sampleSize = sampleSize
		this.sampleCount = sampleCount
		this.entrySize = entrySize
	}

	/**
	 * Reads a SampleSizeBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.6.3 Sample Size Box
	 */
	static read(view: IsoView): SampleSizeBox {
		const { version, flags } = view.readFullBox()
		const sampleSize = view.readUint(4)
		const sampleCount = view.readUint(4)
		let entrySize: number[] | undefined
		if (sampleSize === 0) {
			entrySize = view.readArray(UINT, 4, sampleCount)
		}
		return new SampleSizeBox(version, flags, sampleSize, sampleCount, entrySize)
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox) + 4 (sampleSize) + 4 (sampleCount) + optional entrySize array
		let size = 20

		if (this.sampleSize === 0 && this.entrySize) {
			size += this.entrySize.length * 4
		}

		return size
	}

	/**
	 * Writes a SampleSizeBox to a DataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.6.3 Sample Size Box
	 */
	write(dataView: DataView, offset: number = 0): number {
		const bufferOffset = dataView.byteOffset + offset
		let cursor = bufferOffset

		// Write box header
		writeUint(dataView, cursor, 4, this.size)
		cursor += 4
		writeString(dataView, cursor, 4, this.type)
		cursor += 4

		// Write FullBox header
		writeFullBoxHeader(this, dataView, cursor)
		cursor += 4

		// Write sampleSize (4 bytes)
		writeUint(dataView, cursor, 4, this.sampleSize)
		cursor += 4

		// Write sampleCount (4 bytes)
		writeUint(dataView, cursor, 4, this.sampleCount)
		cursor += 4

		// Write entrySize array if sampleSize is 0
		if (this.sampleSize === 0 && this.entrySize) {
			for (const entrySize of this.entrySize) {
				writeUint(dataView, cursor, 4, entrySize)
				cursor += 4
			}
		}

		return cursor - bufferOffset
	}
}

