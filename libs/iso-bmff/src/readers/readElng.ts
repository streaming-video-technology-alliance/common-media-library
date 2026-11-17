import type { ExtendedLanguageBox } from '../boxes/ExtendedLanguageBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `elng` box (`ExtendedLanguageBox`).
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `ExtendedLanguageBox`
 *
 * @public
 */
export function readElng(view: IsoBoxReadView<IsoInt64>): ExtendedLanguageBox {
	return {
		type: 'elng',
		...view.readFullBox(),
		extendedLanguage: view.readUtf8(-1),
	}
}
