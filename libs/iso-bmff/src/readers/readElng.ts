import type { ExtendedLanguageBox } from '../boxes/ExtendedLanguageBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

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
	const view = new IsoBoxReadView(cursor)

	return {
		type: 'elng',
		...view.readFullBox(),
		extendedLanguage: view.readUtf8(-1),
	}
}
