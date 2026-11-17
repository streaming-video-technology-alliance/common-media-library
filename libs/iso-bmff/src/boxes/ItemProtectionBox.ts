import type { ProtectionSchemeInformationBox } from './ProtectionSchemeInformationBox.ts'

/**
 * Child boxes of Item Protection Box
 *
 * @public
 */
export type ItemProtectionBoxChild = ProtectionSchemeInformationBox
/**
 * Item Protection Box (`ipro`).
 *
 * ISO/IEC 14496-12:2015 - 8.11.5
 *
 * @public
 */
export type ItemProtectionBox = {
	type: 'ipro'
	boxes: ItemProtectionBoxChild[]
	protectionCount: number
}
