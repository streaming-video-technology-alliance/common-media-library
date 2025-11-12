import type { SampleSizeBox } from '../boxes/SampleSizeBox.ts'
import { UINT } from '../fields/UINT.ts'
import type { IsoView } from '../IsoView.ts'
import { FullBoxBase } from './FullBoxBase.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.6.3 Sample Size Box
 */
export class stsz extends FullBoxBase<SampleSizeBox> {
	static readonly type = 'stsz'

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
		return new stsz(sampleSize, sampleCount, entrySize, version, flags)
	}

	/**
	 * Writes a SampleSizeBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.6.3 Sample Size Box
	 */
	static write(box: SampleSizeBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		view.writeFullBoxHeader(box)
		view.writeUint(box.sampleSize, 4)
		view.writeUint(box.sampleCount, 4)
		if (box.sampleSize === 0 && box.entrySize) {
			for (const entrySize of box.entrySize) {
				view.writeUint(entrySize, 4)
			}
		}
	}

	sampleSize: number
	sampleCount: number
	entrySize?: number[]

	constructor(sampleSize: number, sampleCount: number, entrySize?: number[], version?: number, flags?: number) {
		super('stsz', version, flags)
		this.sampleSize = sampleSize
		this.sampleCount = sampleCount
		this.entrySize = entrySize
	}

	override get size(): number {
		// 4 (sampleSize) + 4 (sampleCount) + optional entrySize array
		let size = 8

		if (this.sampleSize === 0 && this.entrySize) {
			size += this.entrySize.length * 4
		}

		return size
	}
}
