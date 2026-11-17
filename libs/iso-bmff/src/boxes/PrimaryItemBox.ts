import type { FullBox } from './FullBox.ts'

/**
 * Primary Item Box (`pitm`).
 *
 * ISO/IEC 14496-12:2015 - 8.11.4
 *
 * @public
 */
export type PrimaryItemBox = FullBox & {
	type: 'pitm'
	itemId: number
}
