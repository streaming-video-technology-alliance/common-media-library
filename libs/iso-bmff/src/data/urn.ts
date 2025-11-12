import { encodeText } from '@svta/cml-utils'
import type { DataEntryUrnBox } from '../boxes/DataEntryUrnBox.ts'
import type { IsoView } from '../IsoView.ts'
import { FullBoxBase } from './FullBoxBase.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.7.2.2 Data Entry URN Box
 */
export class urn extends FullBoxBase<DataEntryUrnBox> {
	static readonly type = 'urn '

	/**
	 * Reads a DataEntryUrnBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.7.2.2 Data Entry URN Box
	 */
	static read(view: IsoView): DataEntryUrnBox {
		const { version, flags } = view.readFullBox()
		const name = view.readString(-1)
		const location = view.readString(-1)
		return new urn(name, location, version, flags)
	}

	/**
	 * Writes a DataEntryUrnBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.7.2.2 Data Entry URN Box
	 */
	static write(box: DataEntryUrnBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		view.writeFullBoxHeader(box)
		if (box.name) {
			view.writeTerminatedString(box.name)
		}
		if (box.location) {
			view.writeTerminatedString(box.location)
		}
	}

	name?: string
	location?: string

	constructor(name?: string, location?: string, version?: number, flags?: number,) {
		super('urn ', version, flags)
		this.name = name
		this.location = location
	}

	override get size(): number {
		let payloadSize = 0

		if (this.name) {
			payloadSize += encodeText(this.name).length + 1 // null-terminated
		}

		if (this.location) {
			payloadSize += encodeText(this.location).length + 1 // null-terminated
		}

		// payloadSize
		return payloadSize
	}
}
