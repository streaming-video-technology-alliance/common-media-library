import type {
	EventMessageBox,
	EventMessageBoxUnrecognizedVersionNumber,
} from '../boxes/EventMessageBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `emsg` box (`EventMessageBox`).
 *
 * The 64-bit integer fields of the result have the type that the `int64` function of the cursor returns.
 * With no option, they are numbers.
 *
 * ISO/IEC 23009-1:2022 - 5.10.3.3
 *
 * For a version other than 0 or 1, `messageData` holds all bytes after the full box fields.
 * The strings of the result are empty and the numbers are 0.
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `EventMessageBox`
 *
 * @example
 * {@includeCode ../../test/readers/readEmsg.test.ts#example}
 *
 * @public
 */
export function readEmsg<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): EventMessageBox<V> {
	const view = new IsoBoxReadView(cursor)

	const { readUint, readUtf8, readData } = view
	const { version, flags } = view.readFullBox()

	if (version === 0) {
		return {
			type: 'emsg',
			version,
			flags,
			schemeIdUri: readUtf8(-1),
			value: readUtf8(-1),
			timescale: readUint(4),
			presentationTimeDelta: readUint(4),
			eventDuration: readUint(4),
			id: readUint(4),
			messageData: readData(-1),
		}
	}

	if (version === 1) {
		return {
			type: 'emsg',
			version,
			flags,
			timescale: readUint(4),
			presentationTime: view.readWideUint(8),
			eventDuration: readUint(4),
			id: readUint(4),
			schemeIdUri: readUtf8(-1),
			value: readUtf8(-1),
			messageData: readData(-1),
		}
	}

	return {
		type: 'emsg',
		version: version as EventMessageBoxUnrecognizedVersionNumber,
		flags,
		schemeIdUri: '',
		value: '',
		timescale: 0,
		presentationTimeDelta: 0,
		presentationTime: 0,
		eventDuration: 0,
		id: 0,
		messageData: readData(-1),
	}
}
