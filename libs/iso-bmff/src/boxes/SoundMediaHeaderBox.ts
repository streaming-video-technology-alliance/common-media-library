import type { FullBox } from './FullBox.ts'

/**
 * Sound Media Header Box (`smhd`).
 *
 * ISO/IEC 14496-12:2015 - 12.2.2
 *
 * @public
 */
export type SoundMediaHeaderBox = FullBox & {
	type: 'smhd'
	/**
	 * The position of a mono track in a stereo space. The value -1 is full left, 0 is center,
	 * and 1 is full right.
	 */
	balance: number
	reserved: number
}
