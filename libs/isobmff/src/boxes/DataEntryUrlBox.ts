import type { FullBox } from './FullBox.js';

/**
 * Data Entry Url Box - 'url '
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type DataEntryUrlBox = FullBox & {
	type: 'url ';
	location?: string;
};
