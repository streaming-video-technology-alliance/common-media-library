import type { FullBox } from './FullBox.ts'

/**
 * Hint Media Header Box (`hmhd`).
 *
 * ISO/IEC 14496-12:2015 - 12.4.2
 *
 * @public
 */
export type HintMediaHeaderBox = FullBox & {
	type: 'hmhd'
	maxPDUsize: number
	avgPDUsize: number
	maxbitrate: number
	avgbitrate: number
}
