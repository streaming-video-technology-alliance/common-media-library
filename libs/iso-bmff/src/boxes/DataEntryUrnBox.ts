import type { FullBox } from './FullBox.js';

/**
 * Data Entry Urn Box - 'urn '
 *
 *
 * @beta
 */
export type DataEntryUrnBox = FullBox & {
	type: 'urn ';
	name?: string;
	location?: string;
};
