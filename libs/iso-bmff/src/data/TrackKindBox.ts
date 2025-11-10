import { encodeText } from '@svta/cml-utils'
import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:202x - 8.10.4 Track kind box
 */
export class TrackKindBox extends FullBox {
	static readonly type = 'kind'
	schemeUri: string
	value: string

	constructor(version: number, flags: number, schemeUri: string, value: string) {
		super('kind', version, flags)
		this.schemeUri = schemeUri
		this.value = value
	}

	override get size(): number {
		const schemeUriBytes = encodeText(this.schemeUri)
		const valueBytes = encodeText(this.value)
		// 8 (box header) + 4 (FullBox) + schemeUriBytes.length + 1 + valueBytes.length + 1
		return 14 + schemeUriBytes.length + valueBytes.length
	}
}
