import type { DegradationPriorityBox } from '../boxes/DegradationPriorityBox.ts'
import { UINT } from '../fields/UINT.ts'
import type { IsoView } from '../IsoView.ts'
import { FullBoxBase } from './FullBoxBase.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.6.6 Degradation Priority Box
 */
export class stdp extends FullBoxBase<DegradationPriorityBox> {
	static readonly type = 'stdp'

	/**
	 * Reads a DegradationPriorityBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.6.6 Degradation Priority Box
	 */
	static read(view: IsoView): DegradationPriorityBox {
		const { version, flags } = view.readFullBox()
		const priority = view.readArray(UINT, 2, view.bytesRemaining / 2)
		return new stdp(priority, version, flags)
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

	constructor(priority: number[] = [], version?: number, flags?: number) {
		super('stdp', version, flags)
		this.priority = priority
	}

	override get size(): number {
		// (priority.length * 2)
		return this.priority.length * 2
	}
}
