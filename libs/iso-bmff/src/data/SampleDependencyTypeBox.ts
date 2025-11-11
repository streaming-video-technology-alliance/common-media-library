import { UINT } from '../fields/UINT.ts'
import type { IsoView } from '../IsoView.ts'
import { writeFullBoxHeader } from '../writers/writeFullBox.ts'
import { writeString } from '../writers/writeString.ts'
import { writeUint } from '../writers/writeUint.ts'
import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.6.4.1 Sample Dependency Type box
 */
export class SampleDependencyTypeBox extends FullBox {
	static readonly type = 'sdtp'

	/**
	 * Reads a SampleDependencyTypeBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.6.4.1 Sample Dependency Type box
	 */
	static read(view: IsoView): SampleDependencyTypeBox {
		const { version, flags } = view.readFullBox()
		const sampleDependencyTable = view.readArray(UINT, 1, view.bytesRemaining)
		return new SampleDependencyTypeBox(version, flags, sampleDependencyTable)
	}

	/**
	 * Writes a SampleDependencyTypeBox to a DataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.6.4.1 Sample Dependency Type box
	 */
	static write(box: SampleDependencyTypeBox, dataView: DataView, offset: number = 0): number {
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

		// Write sampleDependencyTable (1 byte each)
		for (const value of box.sampleDependencyTable) {
			writeUint(dataView, cursor, 1, value)
			cursor += 1
		}

		return cursor - bufferOffset
	}

	sampleDependencyTable: number[]

	constructor(version: number, flags: number, sampleDependencyTable: number[] = []) {
		super('sdtp', version, flags)
		this.sampleDependencyTable = sampleDependencyTable
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox) + (sampleDependencyTable.length * 1)
		return 12 + this.sampleDependencyTable.length
	}
}
