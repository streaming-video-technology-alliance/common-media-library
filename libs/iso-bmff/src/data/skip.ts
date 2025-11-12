import type { FreeSpaceBox } from '../boxes/FreeSpaceBox.ts'
import type { IsoView } from '../IsoView.ts'
import { BoxBase } from './BoxBase.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.1.2 Free Space Box
 */
export class skip extends BoxBase<FreeSpaceBox<'skip'>> {
	static readonly type = 'skip'

	/**
	 * Reads a FreeSpaceBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.1.2 Free Space Box
	 */
	static read(view: IsoView): FreeSpaceBox<'skip'> {
		const data = view.readData(-1)
		return new skip(data)
	}

	/**
	 * Writes a FreeSpaceBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.1.2 Free Space Box
	 */
	static write(box: FreeSpaceBox<'skip'>, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		if (box.data.length > 0) {
			view.writeBytes(box.data)
		}
	}

	data: Uint8Array

	constructor(data: Uint8Array = new Uint8Array(0)) {
		super('skip')
		this.data = data
	}

	override get size(): number {
		// data length
		return this.data.length
	}
}
