import type { VisualSampleEntryBox } from '../boxes/VisualSampleEntryBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import { readAvc1 } from './readAvc1.ts'

/**
 * Parse a VisualSampleEntryBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed VisualSampleEntryBox
 *
 * @public
 */
export function readHvc1(view: IsoBoxReadView): VisualSampleEntryBox<'hvc1'> {
	return {
		...readAvc1(view),
		type: 'hvc1',
	}
}
