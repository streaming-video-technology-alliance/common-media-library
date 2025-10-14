import type { ExtendedLanguageBox } from '../boxes/ExtendedLanguageBox.ts';
import type { Fields } from '../boxes/Fields.ts';
import type { IsoView } from '../IsoView.ts';

/**
 * Parse a ExtendedLanguageBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed ExtendedLanguageBox
 *
 *
 * @beta
 */
export function elng(view: IsoView): Fields<ExtendedLanguageBox> {
	return {
		...view.readFullBox(),
		extendedLanguage: view.readUtf8(-1),
	};
};
