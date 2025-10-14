import type { FullBox } from './FullBox.ts';

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
