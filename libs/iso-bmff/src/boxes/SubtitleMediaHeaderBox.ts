import type { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2015 - 12.6.2 Subtitle media header Box
 *
 * @public
 */
export type SubtitleMediaHeaderBox = FullBox & {
	type: 'sthd';
};
