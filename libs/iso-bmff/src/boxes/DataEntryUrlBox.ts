import type { FullBox } from './FullBox.ts'

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
