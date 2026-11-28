import type { ExtendedLanguageBox } from '../boxes/ExtendedLanguageBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUint8 } from '../cursor/readUint8.ts'
import { readUint24 } from '../cursor/readUint24.ts'
import { readTerminatedUtf8 } from '../cursor/readTerminatedUtf8.ts'

/**
 * Read the `elng` box (`ExtendedLanguageBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `ExtendedLanguageBox`
 *
 * @public
 */
export function readElng(cursor: IsoBoxReadCursor<IsoInt64>): ExtendedLanguageBox {
	return {
		type: 'elng',
		version: readUint8(cursor),
		flags: readUint24(cursor),
		extendedLanguage: readTerminatedUtf8(cursor),
	}
}
