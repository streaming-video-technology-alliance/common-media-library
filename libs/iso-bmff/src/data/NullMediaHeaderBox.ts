import type { IsoView } from '../IsoView.ts'
import { FullBox } from './FullBox.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.4.5.4 Null Media Header Box
 */
export class NullMediaHeaderBox extends FullBox {
	static readonly type = 'nmhd'

	/**
	 * Reads a NullMediaHeaderBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.4.5.4 Null Media Header Box
	 */
	static read(view: IsoView): NullMediaHeaderBox {
		const { version, flags } = view.readFullBox()
		return new NullMediaHeaderBox(version, flags)
	}

	/**
	 * Writes a NullMediaHeaderBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.4.5.4 Null Media Header Box
	 */
	static write(box: NullMediaHeaderBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		view.writeFullBoxHeader(box)
	}

	constructor(version: number, flags: number) {
		super('nmhd', version, flags)
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox)
		return 12
	}
}
