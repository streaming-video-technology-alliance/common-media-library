import type { FullBox } from './FullBox.ts'

/**
 * Null Media Header Box - 'nmhd'
 *
 * @public
 */
export type NullMediaHeaderBox = FullBox & {
	type: 'nmhd';
};

/**
 * @public
 */
export type nmhd = NullMediaHeaderBox;
