import type { FullBox } from './FullBox.ts'

/**
 * Data Entry Url Box - 'url '
 *
 * @public
 */
export type DataEntryUrlBox = FullBox & {
	type: 'url ';
	location: string;
};

/**
 * @public
 */
export type url = DataEntryUrlBox;
