import { encodeText } from '@svta/cml-utils'
import type { ExtendedLanguageBox } from '../boxes/ExtendedLanguageBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `elng` box (`ExtendedLanguageBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.4.6
 *
 * @param box - The `ExtendedLanguageBox` fields to write
 *
 * @returns An `IsoBoxWriteView` containing the written box
 *
 * @example
 * {@includeCode ../../test/writers/writeElng.test.ts#example}
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

	writer.writeBytes(extendedLanguageBytes)
	writer.writeUint(0, 1)

	return writer
}
