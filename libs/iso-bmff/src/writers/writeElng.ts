import { encodeText } from '@svta/cml-utils'
import type { ExtendedLanguageBox } from '../boxes/ExtendedLanguageBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write an `ExtendedLanguageBox` to an `IsoBoxWriteView`.
 *
 * ISO/IEC 14496-12:2012 - 8.4.6 Extended Language Tag
 *
 * @param box - The `ExtendedLanguageBox` fields to write
 *
 * @returns An `IsoBoxWriteView` containing the encoded box
 *
 * @public
 */
export function writeElng(box: ExtendedLanguageBox): IsoBoxWriteView {
	const extendedLanguageBytes = encodeText(box.extendedLanguage)

	const headerSize = 8
	const fullBoxSize = 4
	const extendedLanguageSize = extendedLanguageBytes.length + 1 // null-terminated
	const totalSize = headerSize + fullBoxSize + extendedLanguageSize

	const writer = new IsoBoxWriteView('elng', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeUtf8TerminatedString(box.extendedLanguage)

	return writer
}
