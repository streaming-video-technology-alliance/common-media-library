import type { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.4.5.3 Sound Media Header Box
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
