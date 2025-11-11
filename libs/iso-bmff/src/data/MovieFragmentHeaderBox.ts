import type { IsoView } from '../IsoView.ts'
import { FullBox } from './FullBox.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.8.5 Movie Fragment Header Box
 */
export class MovieFragmentHeaderBox extends FullBox {
	static readonly type = 'mfhd'

	/**
	 * Reads a MovieFragmentHeaderBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.8.5 Movie Fragment Header Box
	 */
	static read(view: IsoView): MovieFragmentHeaderBox {
		const { version, flags } = view.readFullBox()
		const sequenceNumber = view.readUint(4)
		return new MovieFragmentHeaderBox(version, flags, sequenceNumber)
	}

	/**
	 * Writes a MovieFragmentHeaderBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.8.5 Movie Fragment Header Box
	 */
	static write(box: MovieFragmentHeaderBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		view.writeFullBoxHeader(box)
		view.writeUint(box.sequenceNumber, 4)
	}

	sequenceNumber: number

	constructor(version: number, flags: number, sequenceNumber: number) {
		super('mfhd', version, flags)
		this.sequenceNumber = sequenceNumber
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox) + 4 (sequenceNumber)
		return 16
	}
}
