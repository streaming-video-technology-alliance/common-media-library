import type { FullBox } from './FullBox.ts'

/**
 * Primary Item Box - 'pitm'
 *
 *
 * @beta
 */
export type PrimaryItemBox = FullBox<'pitm'> & {
	itemId: number;
};
