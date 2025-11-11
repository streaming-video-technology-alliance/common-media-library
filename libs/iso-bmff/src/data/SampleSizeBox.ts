import { UINT } from '../fields/UINT.ts'
import type { IsoView } from '../IsoView.ts'
import { FullBox } from './FullBox.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.6.3 Sample Size Box
 */
export class SampleSizeBox extends FullBox {
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
		return new SampleSizeBox(version, flags, sampleSize, sampleCount, entrySize)
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

	constructor(version: number, flags: number, sampleSize: number, sampleCount: number, entrySize?: number[]) {
		super('stsz', version, flags)
		this.sampleSize = sampleSize
		this.sampleCount = sampleCount
		this.entrySize = entrySize
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox) + 4 (sampleSize) + 4 (sampleCount) + optional entrySize array
		let size = 20

		if (this.sampleSize === 0 && this.entrySize) {
			size += this.entrySize.length * 4
		}

		return size
	}
}
