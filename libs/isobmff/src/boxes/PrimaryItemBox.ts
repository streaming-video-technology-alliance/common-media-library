import type { FullBox } from './FullBox.js';

/**
 * Primary Item Box - 'pitm'
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type PrimaryItemBox = FullBox & {
	type: 'pitm';
	itemId: number;
};
