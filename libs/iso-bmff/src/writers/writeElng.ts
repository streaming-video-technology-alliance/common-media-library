import { encodeText } from '@svta/cml-utils'
import type { ExtendedLanguageBox } from '../boxes/ExtendedLanguageBox.ts'
import type { Fields } from '../boxes/Fields.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write an ExtendedLanguageBox to an IsoDataWriter.
 *
 * ISO/IEC 14496-12:2012 - 8.4.6 Extended Language Tag
 *
 * @param box - The ExtendedLanguageBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeElng(box: Fields<ExtendedLanguageBox>): IsoBoxWriteView {
	const extendedLanguageBytes = encodeText(box.extendedLanguage)

	const headerSize = 8
	const fullBoxSize = 4
	const extendedLanguageSize = extendedLanguageBytes.length + 1 // null-terminated
	const totalSize = headerSize + fullBoxSize + extendedLanguageSize

	const writer = new IsoBoxWriteView(totalSize)
	writer.writeBoxHeader('elng', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeUtf8TerminatedString(box.extendedLanguage)

	return writer
}
