import type { FullBox } from './FullBox.ts'

/**
 * Extended Language Box (`elng`).
 *
 * ISO/IEC 14496-12:2015 - 8.4.6
 *
 * @public
 */
export type ExtendedLanguageBox = FullBox & {
	type: 'elng'
	extendedLanguage: string
}
