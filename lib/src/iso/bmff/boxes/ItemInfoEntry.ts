import type { FullBox } from './FullBox.js';

/**
 * Item Info Entry - 'infe'
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type ItemInfoEntry = FullBox & {
	type: 'infe';
	itemId: number;
	itemProtectionIndex: number;
	itemName: string;
	contentType: string;
	contentEncoding?: string;
	extensionType?: string;
};
