import type { EventMessageBox } from '../boxes/EventMessageBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `EventMessageBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `EventMessageBox`
 *
 * @public
 */
export function readEmsg(view: IsoBoxReadView): EventMessageBox {
	const { readUint, readUtf8, readData } = view
	const { version, flags } = view.readFullBox()

	if (version === 1) {
		return {
			type: 'emsg',
			version: 1,
			flags,
			timescale: readUint(4),
			presentationTime: readUint(8),
			eventDuration: readUint(4),
			id: readUint(4),
			schemeIdUri: readUtf8(-1),
			value: readUtf8(-1),
			messageData: readData(-1),
		}
	}

	return {
		type: 'emsg',
		version: 0,
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
