import type { ExtendedLanguageBox } from '../boxes/ExtendedLanguageBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `ExtendedLanguageBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `ExtendedLanguageBox`
 *
 * @public
 */
export function readElng(view: IsoBoxReadView): ExtendedLanguageBox {
	return {
		type: 'elng',
		...view.readFullBox(),
		extendedLanguage: view.readUtf8(-1),
	}
};
