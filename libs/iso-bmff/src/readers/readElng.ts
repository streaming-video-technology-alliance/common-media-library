import type { ExtendedLanguageBox } from '../boxes/types/ExtendedLanguageBox.ts'
import type { Fields } from '../boxes/types/Fields.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a ExtendedLanguageBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed ExtendedLanguageBox
 *
 * @public
 */
export function readElng(view: IsoBoxReadView): Fields<ExtendedLanguageBox> {
	return {
		...view.readFullBox(),
		extendedLanguage: view.readUtf8(-1),
	}
};
