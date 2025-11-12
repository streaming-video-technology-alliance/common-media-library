import type { NullMediaHeaderBox } from '../boxes/NullMediaHeaderBox.ts'
import type { IsoView } from '../IsoView.ts'
import { FullBoxBase } from './FullBoxBase.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.4.5.4 Null Media Header Box
 */
export class nmhd extends FullBoxBase<NullMediaHeaderBox> {
	static readonly type = 'nmhd'

	/**
	 * Reads a NullMediaHeaderBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.4.5.4 Null Media Header Box
	 */
	static read(view: IsoView): NullMediaHeaderBox {
		const { version, flags } = view.readFullBox()
		return new nmhd(version, flags)
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

	constructor(version?: number, flags?: number) {
		super('nmhd', version, flags)
	}

	override get size(): number {
		return 0
	}
}
