import type { EventMessageBox } from '../boxes/EventMessageBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Parse a `EventMessageBox` from an `IsoBoxReadView`.
 *
 * The 64-bit integer fields of the result have the type that the `int64` option of the view returns.
 * With no option, they are numbers.
 *
 * ISO/IEC 23009-1 - 5.10.3.3 Event Message Box
 *
 * For a version other than 0 or 1, the result has the full box fields and `messageData` only.
 * `messageData` holds all bytes after the full box fields.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `EventMessageBox`
 *
 * @example
 * {@includeCode ../../test/readers/readEmsg.test.ts#example}
 *
 * @public
 */
export function readEmsg<V extends IsoInt64>(view: IsoBoxReadView<V>): EventMessageBox<V> {
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
		version,
		flags,
		messageData: readData(-1),
	}
}
