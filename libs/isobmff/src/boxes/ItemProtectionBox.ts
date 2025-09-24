import type { ContainerBox } from './ContainerBox.js';
import type { ProtectionSchemeInformationBox } from './ProtectionSchemeInformationBox.js';

/**
 * Item Protection Box - 'ipro' - Container
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type ItemProtectionBox = ContainerBox<ProtectionSchemeInformationBox> & {
	type: 'ipro';
	protectionCount: number;
};
