import type { OriginalFormatBox } from '../boxes/OriginalFormatBox.ts'
import type { IsoView } from '../IsoView.ts'
import { BoxBase } from './BoxBase.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.12.2 Original Format Box
 */
export class frma extends BoxBase<OriginalFormatBox> {
	static readonly type = 'frma'

	/**
	 * Reads an OriginalFormatBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.12.2 Original Format Box
	 */
	static read(view: IsoView): OriginalFormatBox {
		const dataFormat = view.readUint(4)
		return new frma(dataFormat)
	}

	/**
	 * Writes an OriginalFormatBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.12.2 Original Format Box
	 */
	static write(box: OriginalFormatBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		view.writeUint(box.dataFormat, 4)
	}

	dataFormat: number

	constructor(dataFormat: number) {
		super('frma')
		this.dataFormat = dataFormat
	}

	override get size(): number {
		// 8 bytes header + 4 (dataFormat)
		return 4
	}
}
