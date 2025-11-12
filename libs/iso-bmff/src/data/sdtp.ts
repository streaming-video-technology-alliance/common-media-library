import type { SampleDependencyTypeBox } from '../boxes/SampleDependencyTypeBox.ts'
import { UINT } from '../fields/UINT.ts'
import type { IsoView } from '../IsoView.ts'
import { FullBoxBase } from './FullBoxBase.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.6.4.1 Sample Dependency Type box
 */
export class sdtp extends FullBoxBase<SampleDependencyTypeBox> {
	static readonly type = 'sdtp'

	/**
	 * Reads a SampleDependencyTypeBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.6.4.1 Sample Dependency Type box
	 */
	static read(view: IsoView): SampleDependencyTypeBox {
		const { version, flags } = view.readFullBox()
		const sampleDependencyTable = view.readArray(UINT, 1, view.bytesRemaining)
		return new sdtp(sampleDependencyTable, version, flags)
	}

	/**
	 * Writes a SampleDependencyTypeBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.6.4.1 Sample Dependency Type box
	 */
	static write(box: SampleDependencyTypeBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		view.writeFullBoxHeader(box)
		for (const value of box.sampleDependencyTable) {
			view.writeUint(value, 1)
		}
	}

	sampleDependencyTable: number[]

	constructor(sampleDependencyTable: number[] = [], version?: number, flags?: number) {
		super('sdtp', version, flags)
		this.sampleDependencyTable = sampleDependencyTable
	}

	override get size(): number {
		// (sampleDependencyTable.length * 1)
		return this.sampleDependencyTable.length
	}
}
