import { UINT } from '../fields/UINT.ts'
import type { IsoView } from '../IsoView.ts'
import { writeFullBoxHeader } from '../writers/writeFullBox.ts'
import { writeString } from '../writers/writeString.ts'
import { writeUint } from '../writers/writeUint.ts'
import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.6.6 Degradation Priority Box
 */
export class DegradationPriorityBox extends FullBox {
	static readonly type = 'stdp'

	/**
	 * Reads a DegradationPriorityBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.6.6 Degradation Priority Box
	 */
	static read(view: IsoView): DegradationPriorityBox {
		const { version, flags } = view.readFullBox()
		const priority = view.readArray(UINT, 2, view.bytesRemaining / 2)
		return new DegradationPriorityBox(version, flags, priority)
	}

	/**
	 * Writes a DegradationPriorityBox to a DataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.6.6 Degradation Priority Box
	 */
	static write(box: DegradationPriorityBox, dataView: DataView, offset: number = 0): number {
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

		// Write priority array (2 bytes each)
		for (const value of box.priority) {
			writeUint(dataView, cursor, 2, value)
			cursor += 2
		}

		return cursor - bufferOffset
	}

	priority: number[]

	constructor(version: number, flags: number, priority: number[] = []) {
		super('stdp', version, flags)
		this.priority = priority
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox) + (priority.length * 2)
		return 12 + (this.priority.length * 2)
	}
}
