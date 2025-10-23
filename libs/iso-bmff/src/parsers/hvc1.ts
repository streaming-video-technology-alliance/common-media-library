import type { Fields } from '../boxes/Fields.ts'
import type { VisualSampleEntryBox } from '../boxes/VisualSampleEntryBox.ts'
import type { IsoView } from '../IsoView.ts'
import { avc1 } from './avc1.ts'

/**
 * Parse a VisualSampleEntryBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed VisualSampleEntryBox
 *
 *
 * @beta
 */
export function hvc1(view: IsoView): Fields<VisualSampleEntryBox<'avc1'>> {
	return avc1(view)
}
