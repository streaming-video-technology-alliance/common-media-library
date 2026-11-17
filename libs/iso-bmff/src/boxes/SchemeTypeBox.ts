import type { FullBox } from './FullBox.ts'

/**
 * Scheme Type Box (`schm`).
 *
 * ISO/IEC 14496-12:2015 - 8.12.5
 *
 * @public
 */
export type SchemeTypeBox = FullBox & {
	type: 'schm'
	schemeType: number
	schemeVersion: number
	schemeUri?: string
}
