import type { FullBox } from './FullBox.ts'

/**
 * Null Media Header Box (`nmhd`).
 *
 * ISO/IEC 14496-12:2015 - 8.4.5.2
 *
 * @public
 */
export type NullMediaHeaderBox = FullBox & {
	type: 'nmhd'
}
