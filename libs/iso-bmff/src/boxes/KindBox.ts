import type { FullBox } from './FullBox.ts'

/**
 * Track Kind Box (`kind`).
 *
 * ISO/IEC 14496-12:2015 - 8.10.4
 *
 * @public
 */
export type KindBox = FullBox & {
	type: 'kind'
	schemeUri: string
	value: string
}
