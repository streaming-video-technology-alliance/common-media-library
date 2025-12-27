import type { FullBox } from './FullBox.ts'

/**
 * Data Entry Urn Box - 'urn '
 *
 * @public
 */
export type DataEntryUrnBox = FullBox & {
	type: 'urn ';
	name?: string;
	location?: string;
};
