import type { IsoView } from '../IsoView.ts'
import { Box } from './Box.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.1.2 Free Space Box
 */
export class FreeSpaceBox extends Box {
	static readonly type = 'free'

	/**
	 * Reads a FreeSpaceBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.1.2 Free Space Box
	 */
	static read(view: IsoView, type: 'free' | 'skip' = 'free'): FreeSpaceBox {
		const data = view.readData(-1)
		return new FreeSpaceBox(type, data)
	}

	/**
	 * Writes a FreeSpaceBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.1.2 Free Space Box
	 */
	static write(box: FreeSpaceBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		if (box.data.length > 0) {
			view.writeBytes(box.data)
		}
	}

	data: Uint8Array

	constructor(type: 'free' | 'skip' = 'free', data: Uint8Array = new Uint8Array(0)) {
		super(type)
		this.data = data
	}

	override get size(): number {
		// 8 bytes header + data length
		return 8 + this.data.length
	}
}
