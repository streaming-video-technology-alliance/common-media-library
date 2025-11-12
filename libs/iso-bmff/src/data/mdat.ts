import type { MediaDataBox } from '../boxes/MediaDataBox.ts'
import type { IsoView } from '../IsoView.ts'
import { BoxBase } from './BoxBase.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.1.1 Media Data Box
 */
export class mdat extends BoxBase<MediaDataBox> {
	static readonly type = 'mdat'

	/**
	 * Reads a MediaDataBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.1.1 Media Data Box
	 */
	static read(view: IsoView): MediaDataBox {
		const data = view.readData(-1)
		console.log('DATA', data)
		return new mdat(data)
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

	data: Uint8Array<ArrayBuffer>

	constructor(data: Uint8Array<ArrayBuffer> = new Uint8Array<ArrayBuffer>(new ArrayBuffer(0))) {
		super('mdat')
		this.data = data
	}

	override get size(): number {
		// data length
		return this.data.length
	}
}
