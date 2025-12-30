import type { ProtectionSchemeInformationBox } from './ProtectionSchemeInformationBox.ts'

/**
 * Child boxes of Item Protection Box
 *
 * @public
 */
export type ItemProtectionBoxChild = ProtectionSchemeInformationBox;
/**
 * Item Protection Box - 'ipro' - Container
 *
 * @public
 */
export type ItemProtectionBox = {
	type: 'ipro';
	boxes: ItemProtectionBoxChild[];
	protectionCount: number;
};

/**
 * @public
 */
export type ipro = ItemProtectionBox;
