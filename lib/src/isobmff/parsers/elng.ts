import type { CursorView } from '../CursorView.js';
import type { FullBox } from '../FullBox.js';

export type ExtendedLanguageBox = FullBox & {
	extendedLanguage: string;
}

// ISO/IEC 14496-12:202x - 8.4.6 Extended language tag
export function elng(view: CursorView): ExtendedLanguageBox {
	return {
		...view.readFullBox(),
		extendedLanguage: view.readUtf8(-1),
	};
};
