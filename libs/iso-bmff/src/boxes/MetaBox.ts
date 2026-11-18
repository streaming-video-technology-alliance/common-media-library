import type { IsoInt64 } from '../IsoInt64.ts'
import type { DataInformationBox } from './DataInformationBox.ts'
import type { FullBox } from './FullBox.ts'
import type { GroupsListBox } from './GroupsListBox.ts'
import type { HandlerReferenceBox } from './HandlerReferenceBox.ts'

/**
 * Child boxes of Meta Box
 *
 * @public
 */
export type MetaBoxChild<V extends IsoInt64 = number> =
	| HandlerReferenceBox
	| DataInformationBox
	| GroupsListBox<V>

/**
 * Meta Box (`meta`).
 *
 * ISO/IEC 14496-12:2015 - 8.11.1
 *
 * @public
 */
export type MetaBox<V extends IsoInt64 = number> = FullBox & {
	type: 'meta'
	boxes: MetaBoxChild<V>[]
}
