import { encodeText } from '@svta/cml-utils'
import type { IsoView } from '../IsoView.ts'
import { FullBox } from './FullBox.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.12.5 Scheme Type Box
 */
export class SchemeTypeBox extends FullBox {
	static readonly type = 'schm'

	/**
	 * Reads a SchemeTypeBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.12.5 Scheme Type Box
	 */
	static read(view: IsoView): SchemeTypeBox {
		const { version, flags } = view.readFullBox()
		const schemeType = view.readUint(4)
		const schemeVersion = view.readUint(4)
		const schemeUri = flags & 0x000001 ? view.readString(-1) : undefined
		return new SchemeTypeBox(version, flags, schemeType, schemeVersion, schemeUri)
	}

	/**
	 * Writes a SchemeTypeBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.12.5 Scheme Type Box
	 */
	static write(box: SchemeTypeBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		view.writeFullBoxHeader(box)
		view.writeUint(box.schemeType, 4)
		view.writeUint(box.schemeVersion, 4)
		if (box.schemeUri) {
			view.writeUtf8TerminatedString(box.schemeUri)
		}
	}

	schemeType: number
	schemeVersion: number
	schemeUri?: string

	constructor(version: number, flags: number, schemeType: number, schemeVersion: number, schemeUri?: string) {
		super('schm', version, flags)
		this.schemeType = schemeType
		this.schemeVersion = schemeVersion
		this.schemeUri = schemeUri
	}

	override get size(): number {
		let size = 20 // header + FullBox + schemeType + schemeVersion

		if (this.schemeUri) {
			const uriBytes = encodeText(this.schemeUri)
			size += uriBytes.length + 1 // null-terminated
		}

		return size
	}
}
