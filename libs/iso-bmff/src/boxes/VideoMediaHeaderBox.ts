import type { FullBox } from './FullBox.ts'

/**
 * Video Media Header Box (`vmhd`).
 *
 * ISO/IEC 14496-12:2015 - 12.1.2
 *
 * @public
 */
export type VideoMediaHeaderBox = FullBox & {
	type: 'vmhd'
	graphicsmode: number
	opcolor: number[]
}
