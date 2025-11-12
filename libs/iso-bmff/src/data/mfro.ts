import type { MovieFragmentRandomAccessOffsetBox } from '../boxes/MovieFragmentRandomAccessOffsetBox.ts'
import type { IsoView } from '../IsoView.ts'
import { FullBoxBase } from './FullBoxBase.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.8.11 Movie Fragment Random Access Box
 */
export class mfro extends FullBoxBase<MovieFragmentRandomAccessOffsetBox> {
	static readonly type = 'mfro'

	/**
	 * Reads a MovieFragmentRandomAccessOffsetBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.8.11 Movie Fragment Random Access Box
	 */
	static read(view: IsoView): MovieFragmentRandomAccessOffsetBox {
		const { version, flags } = view.readFullBox()
		const mfraSize = view.readUint(4)
		return new mfro(mfraSize, version, flags)
	}

	/**
	 * Writes a MovieFragmentRandomAccessOffsetBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.8.11 Movie Fragment Random Access Box
	 */
	static write(box: MovieFragmentRandomAccessOffsetBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		view.writeFullBoxHeader(box)
		view.writeUint(box.mfraSize, 4)
	}

	mfraSize: number

	constructor(mfraSize: number, version?: number, flags?: number) {
		super('mfro', version, flags)
		this.mfraSize = mfraSize
	}

	override get size(): number {
		// 4 (mfraSize)
		return 4
	}
}
