import type { ContainerBox } from './ContainerBox.ts'
import type { ProtectionSchemeInformationBox } from './ProtectionSchemeInformationBox.ts'

/**
 * Item Protection Box - 'ipro' - Container
 *
 * @public
 */
export type ItemProtectionBox = ContainerBox<ProtectionSchemeInformationBox> & {
	type: 'ipro';
	protectionCount: number;
};

/**
 * @public
 */
export type ipro = ItemProtectionBox;
