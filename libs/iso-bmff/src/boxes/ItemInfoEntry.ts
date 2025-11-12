import type { FullBox } from './FullBox.ts'

/**
 * Item Info Entry - 'infe'
 *
 *
 * @beta
 */
export type ItemInfoEntry = FullBox<'infe'> & {
	itemId: number;
	itemProtectionIndex: number;
	itemName: string;
	contentType: string;
	contentEncoding?: string;
	extensionType?: string;
};
