import type { FullBox } from './FullBox.js';

/**
 * Null Media Header Box - 'nmhd'
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type NullMediaHeaderBox = FullBox & {
	type: 'nmhd';
};
