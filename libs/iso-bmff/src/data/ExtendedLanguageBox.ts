import { encodeText } from '@svta/cml-utils'
import type { IsoView } from '../IsoView.ts'
import { FullBox } from './FullBox.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:202x - 8.4.6 Extended language tag
 */
export class ExtendedLanguageBox extends FullBox {
	static readonly type = 'elng'

	/**
	 * Reads an ExtendedLanguageBox from an IsoView
	 *
	 * ISO/IEC 14496-12:202x - 8.4.6 Extended language tag
	 */
	static read(view: IsoView): ExtendedLanguageBox {
		const { version, flags } = view.readFullBox()
		const extendedLanguage = view.readUtf8(-1)
		return new ExtendedLanguageBox(version, flags, extendedLanguage)
	}

	/**
	 * Writes an ExtendedLanguageBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:202x - 8.4.6 Extended language tag
	 */
	static write(box: ExtendedLanguageBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		view.writeFullBoxHeader(box)
		view.writeUtf8TerminatedString(box.extendedLanguage)
	}

	extendedLanguage: string

	constructor(version: number, flags: number, extendedLanguage: string) {
		super('elng', version, flags)
		this.extendedLanguage = extendedLanguage
	}

	override get size(): number {
		const langBytes = encodeText(this.extendedLanguage)
		// 8 (box header) + 4 (FullBox) + langBytes.length + 1 (null terminator)
		return 12 + langBytes.length + 1
	}
}
