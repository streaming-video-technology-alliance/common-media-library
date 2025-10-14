import type { FullBox } from './FullBox.ts';

/**
 * ISO/IEC 14496-12:2012 - 8.4.5.3 Sound Media Header Box
 *
 *
 * @beta
 */
export type SoundMediaHeaderBox = FullBox & {
	type: 'smhd';
	balance: number;
	reserved: number;
};
