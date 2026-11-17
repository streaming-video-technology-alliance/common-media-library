import type { FullBox } from './FullBox.ts'

/**
 * Subtitle Media Header Box (`sthd`).
 *
 * ISO/IEC 14496-12:2015 - 12.6.2
 *
 * @public
 */
export type SubtitleMediaHeaderBox = FullBox & {
	type: 'sthd'
}
