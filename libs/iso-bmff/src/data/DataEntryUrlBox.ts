import { encodeText } from '@svta/cml-utils'
import type { IsoView } from '../IsoView.ts'
import { FullBox } from './FullBox.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.7.2.1 Data Entry URL Box
 */
export class DataEntryUrlBox extends FullBox {
	static readonly type = 'url'

	/**
	 * Reads a DataEntryUrlBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.7.2.1 Data Entry URL Box
	 */
	static read(view: IsoView): DataEntryUrlBox {
		const { version, flags } = view.readFullBox()
		const location = view.readString(-1)
		return new DataEntryUrlBox(version, flags, location)
	}

	/**
	 * Writes a DataEntryUrlBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.7.2.1 Data Entry URL Box
	 */
	static write(box: DataEntryUrlBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		view.writeFullBoxHeader(box)
		if (box.location) {
			view.writeTerminatedString(box.location)
		}
	}

	location?: string

	constructor(version: number, flags: number, location?: string) {
		super('url', version, flags)
		this.location = location
	}

	override get size(): number {
		let payloadSize = 0
		if (this.location) {
			payloadSize = encodeText(this.location).length + 1 // null-terminated
		}
		// 8 (box header) + 4 (FullBox) + payloadSize
		return 12 + payloadSize
	}
}
