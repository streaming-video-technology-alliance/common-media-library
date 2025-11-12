import type { FullBox } from './FullBox.ts'

/**
 * Data Entry Urn Box - 'urn '
 *
 *
 * @beta
 */
export type DataEntryUrnBox = FullBox<'urn '> & {
	name?: string;
	location?: string;
};
