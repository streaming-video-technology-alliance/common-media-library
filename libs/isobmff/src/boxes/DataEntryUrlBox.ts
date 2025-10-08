import type { FullBox } from './FullBox.js';

/**
 * Data Entry Url Box - 'url '
 *
 *
 * @beta
 */
export type DataEntryUrlBox = FullBox & {
	type: 'url ';
	location?: string;
};
