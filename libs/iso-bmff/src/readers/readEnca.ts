import type { enca } from '../boxes/AudioSampleEntryBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import { readMp4a } from './readMp4a.ts'

/**
 * Parse an AudioSampleEntry from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed AudioSampleEntry
 *
 * @public
 */
export function readEnca(view: IsoBoxReadView): enca {
	return {
		...readMp4a(view),
		type: 'enca',
	}
}
