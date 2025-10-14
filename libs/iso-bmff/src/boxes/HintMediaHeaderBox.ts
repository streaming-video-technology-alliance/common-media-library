import type { FullBox } from './FullBox.ts';

/**
 * Hint Media Header Box - 'hmhd'
 *
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
