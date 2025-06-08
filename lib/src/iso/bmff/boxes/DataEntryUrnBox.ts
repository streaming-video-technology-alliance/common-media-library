import type { FullBox } from './FullBox.js';

/**
 * Data Entry Urn Box - 'urn '
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type DataEntryUrnBox = FullBox & {
	type: 'urn ';
	name?: string;
	location?: string;
};
