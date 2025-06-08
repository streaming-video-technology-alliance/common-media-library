import type { FullBox } from './FullBox.js';

/**
 * ISO/IEC 14496-12:2012 - 8.4.5.3 Sound Media Header Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type SoundMediaHeaderBox = FullBox & {
	type: 'smhd';
	balance: number;
	reserved: number;
};
