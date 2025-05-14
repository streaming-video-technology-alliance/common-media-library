import type { FullBox } from '../FullBox';
import type { IsoView } from '../IsoView';

/**
 * ISO/IEC 14496-12:202x - 8.4.6 Extended language tag
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type ExtendedLanguageBox = FullBox & {
	extendedLanguage: string;
};

/**
 * Parse a ExtendedLanguageBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed ExtendedLanguageBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function elng(view: IsoView): ExtendedLanguageBox {
	return {
		...view.readFullBox(),
		extendedLanguage: view.readUtf8(-1),
	};
};
