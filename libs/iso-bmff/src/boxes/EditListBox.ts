import type { IsoInt64 } from '../IsoInt64.ts'
import type { EditListEntry } from './EditListEntry.ts'
import type { FullBox } from './FullBox.ts'

/**
 * Edit List Box (`elst`).
 *
 * ISO/IEC 14496-12:2015 - 8.6.6
 *
 * @public
 */
export type EditListBox<V extends IsoInt64 = number> = FullBox & {
	type: 'elst'
	entries: EditListEntry<V>[]
}
