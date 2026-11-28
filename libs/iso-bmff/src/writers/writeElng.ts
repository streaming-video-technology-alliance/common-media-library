import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { ExtendedLanguageBox } from '../boxes/ExtendedLanguageBox.ts'
import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import { writeTerminatedUtf8 } from '../cursor/writeTerminatedUtf8.ts'
import { endIsoBox } from '../endIsoBox.ts'

/**
 * Write the `elng` box (`ExtendedLanguageBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.4.6
 *
 * @param cursor - The write cursor
 * @param box - The `ExtendedLanguageBox` fields to write
 *
 * @throws RangeError if a value of the box does not fit its field.
 *
 * @example
 * {@includeCode ../../test/writers/writeElng.test.ts#example}
 *
 * @public
 */
export function writeElng(cursor: IsoBoxWriteCursor, box: ExtendedLanguageBox): void {
	const start = beginIsoFullBox(cursor, 'elng', box.version, box.flags)

	writeTerminatedUtf8(cursor, box.extendedLanguage)
	endIsoBox(cursor, start)
}
