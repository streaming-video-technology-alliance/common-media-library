import type { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:202x - 8.4.6 Extended language tag
 *
 *
 * @beta
 */
export type ExtendedLanguageBox = FullBox & {
	type: 'elng';
	extendedLanguage: string;
};
