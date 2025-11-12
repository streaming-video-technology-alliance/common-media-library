import type { ContainerBox } from './ContainerBox.ts'
import type { ProtectionSchemeInformationBox } from './ProtectionSchemeInformationBox.ts'

/**
 * Item Protection Box - 'ipro' - Container
 *
 *
 * @beta
 */
export type ItemProtectionBox = ContainerBox<'ipro', ProtectionSchemeInformationBox> & {
	protectionCount: number;
};
