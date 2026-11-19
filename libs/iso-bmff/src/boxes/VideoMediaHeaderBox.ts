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
	graphicsMode: number
	/** The red, green, and blue values of the color for the graphics mode. */
	opColor: [red: number, green: number, blue: number]
}
