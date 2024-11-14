import type { FullBox } from '../FullBox.js';
import type { IsoView } from '../IsoView.js';

export type ExtendedLanguageBox = FullBox & {
	extendedLanguage: string;
}

// ISO/IEC 14496-12:202x - 8.4.6 Extended language tag
export function elng(view: IsoView): ExtendedLanguageBox {
	return {
		...view.readFullBox(),
		extendedLanguage: view.readUtf8(-1),
	};
};
