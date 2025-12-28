import type { EventMessageBox } from '../boxes/EventMessageBox.ts'
import type { Fields } from '../boxes/Fields.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse an EventMessageBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed EventMessageBox
 *
 * @public
 */
export function readEmsg(view: IsoBoxReadView): Fields<EventMessageBox> {
	const { readUint, readString, readData } = view

	const result = { ...view.readFullBox() } as EventMessageBox

	if (result.version == 1) {
		result.timescale = readUint(4)
		result.presentationTime = readUint(8)
		result.eventDuration = readUint(4)
		result.id = readUint(4)
		result.schemeIdUri = readString(-1)
		result.value = readString(-1)
	}
	else {
		result.schemeIdUri = readString(-1)
		result.value = readString(-1)
		result.timescale = readUint(4)
		result.presentationTimeDelta = readUint(4)
		result.eventDuration = readUint(4)
		result.id = readUint(4)
	}

	result.messageData = readData(-1)

	return result
}
