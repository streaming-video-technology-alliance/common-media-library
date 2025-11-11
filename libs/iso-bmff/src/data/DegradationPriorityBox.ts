import { UINT } from '../fields/UINT.ts'
import type { IsoView } from '../IsoView.ts'
import { FullBox } from './FullBox.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

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
	 * Writes a DegradationPriorityBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.6.6 Degradation Priority Box
	 */
	static write(box: DegradationPriorityBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		view.writeFullBoxHeader(box)
		for (const value of box.priority) {
			view.writeUint(value, 2)
		}
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
