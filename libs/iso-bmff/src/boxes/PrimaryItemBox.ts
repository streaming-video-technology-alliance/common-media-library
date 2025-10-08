import type { FullBox } from './FullBox.js';

/**
 * Primary Item Box - 'pitm'
 *
 *
 * @beta
 */
export type PrimaryItemBox = FullBox & {
	type: 'pitm';
	itemId: number;
};
