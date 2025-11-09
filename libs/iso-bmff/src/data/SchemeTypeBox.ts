import { encodeText } from '@svta/cml-utils'
import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.12.5 Scheme Type Box
 */
export class SchemeTypeBox extends FullBox {
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

