import type { IsoInt64 } from '../IsoInt64.ts'
import type { EditListEntry } from './EditListEntry.ts'
import type { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.6.6 Edit List Box
 *
 * @public
 */
export type EditListBox<V extends IsoInt64 = number> = FullBox & {
	type: 'elst'
	entryCount: number
	entries: EditListEntry<V>[]
}
