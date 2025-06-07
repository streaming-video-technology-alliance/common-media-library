import type { FullBox } from './FullBox.js';

/**
 * Sound Media Header Box - 'smhd'
 */
export type SoundMediaHeaderBox = FullBox & {
	type: 'smhd';
	balance: number;
};
