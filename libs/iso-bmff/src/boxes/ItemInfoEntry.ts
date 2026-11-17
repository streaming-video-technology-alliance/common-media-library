import type { FullBox } from './FullBox.ts'

/**
 * Item Info Entry (`infe`).
 *
 * ISO/IEC 14496-12:2015 - 8.11.6
 *
 * @public
 */
export type ItemInfoEntry = FullBox & {
	type: 'infe'
	itemId: number
	itemProtectionIndex: number
	itemName: string
	contentType: string
	contentEncoding?: string
	extensionType?: string
}
