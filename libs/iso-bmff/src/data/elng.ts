import { encodeText } from '@svta/cml-utils'
import type { ExtendedLanguageBox } from '../boxes/ExtendedLanguageBox.ts'
import type { IsoView } from '../IsoView.ts'
import { FullBoxBase } from './FullBoxBase.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:202x - 8.4.6 Extended language tag
 */
export class elng extends FullBoxBase<ExtendedLanguageBox> {
	static readonly type = 'elng'

	/**
	 * Reads an ExtendedLanguageBox from an IsoView
	 *
	 * ISO/IEC 14496-12:202x - 8.4.6 Extended language tag
	 */
	static read(view: IsoView): ExtendedLanguageBox {
		const { version, flags } = view.readFullBox()
		const extendedLanguage = view.readUtf8(-1)
		return new elng(extendedLanguage, version, flags)
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

	constructor(extendedLanguage: string, version?: number, flags?: number) {
		super('elng', version, flags)
		this.extendedLanguage = extendedLanguage
	}

	override get size(): number {
		const langBytes = encodeText(this.extendedLanguage)
		// langBytes.length + 1 (null terminator)
		return langBytes.length + 1
	}
}
