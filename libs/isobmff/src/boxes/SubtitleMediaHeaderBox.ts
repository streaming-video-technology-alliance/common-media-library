import type { FullBox } from './FullBox.js';

/**
 * ISO/IEC 14496-12:2015 - 12.6.2 Subtitle media header Box
 *
 *
 * @beta
 */
export type SubtitleMediaHeaderBox = FullBox & {
	type: 'sthd';
};
