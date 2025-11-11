import type { IsoView } from '../IsoView.ts'
import { Box } from './Box.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.1.1 Media Data Box
 */
export class MediaDataBox extends Box {
	static readonly type = 'mdat'

	/**
	 * Reads a MediaDataBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.1.1 Media Data Box
	 */
	static read(view: IsoView): MediaDataBox {
		const data = view.readData(-1)
		return new MediaDataBox(data)
	}

	/**
	 * Writes a MediaDataBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.1.1 Media Data Box
	 */
	static write(box: MediaDataBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		if (box.data.length > 0) {
			view.writeBytes(box.data)
		}
	}

	data: Uint8Array

	constructor(data: Uint8Array = new Uint8Array(0)) {
		super('mdat')
		this.data = data
	}

	override get size(): number {
		// 8 bytes header + data length
		return 8 + this.data.length
	}
}
