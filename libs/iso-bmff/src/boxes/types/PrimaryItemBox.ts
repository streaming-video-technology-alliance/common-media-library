import type { FullBox } from './FullBox.ts'

/**
 * Primary Item Box - 'pitm'
 *
 * @public
 */
export type PrimaryItemBox = FullBox & {
	type: 'pitm';
	itemId: number;
};
