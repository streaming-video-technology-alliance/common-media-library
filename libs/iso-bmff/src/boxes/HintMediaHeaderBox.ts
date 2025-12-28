import type { FullBox } from './FullBox.ts'

/**
 * Hint Media Header Box - 'hmhd'
 *
 * @public
 */
export type HintMediaHeaderBox = FullBox & {
	type: 'hmhd';
	maxPDUsize: number;
	avgPDUsize: number;
	maxbitrate: number;
	avgbitrate: number;
};

/**
 * @public
 */
export type hmhd = HintMediaHeaderBox;
