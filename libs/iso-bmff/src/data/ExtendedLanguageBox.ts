import { encodeText } from '@svta/cml-utils'
import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:202x - 8.4.6 Extended language tag
 */
export class ExtendedLanguageBox extends FullBox {
	extendedLanguage: string

	constructor(version: number, flags: number, extendedLanguage: string) {
		super('elng', version, flags)
		this.extendedLanguage = extendedLanguage
	}

	override get size(): number {
		const langBytes = encodeText(this.extendedLanguage)
		// 8 (box header) + 4 (FullBox) + langBytes.length
		return 12 + langBytes.length
	}
}

