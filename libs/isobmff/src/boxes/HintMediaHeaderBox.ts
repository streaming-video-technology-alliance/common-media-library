import type { FullBox } from './FullBox.js';

/**
 * Hint Media Header Box - 'hmhd'
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type HintMediaHeaderBox = FullBox & {
	type: 'hmhd';
	maxPDUsize: number;
	avgPDUsize: number;
	maxbitrate: number;
	avgbitrate: number;
};
