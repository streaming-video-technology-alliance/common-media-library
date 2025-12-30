import type { EventMessageBox } from '../boxes/EventMessageBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write an EventMessageBox to an IsoDataWriter.
 *
 * ISO/IEC 23009-1 - 5.10.3.3 Event Message Box
 *
 * @param box - The EventMessageBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeEmsg(box: EventMessageBox): IsoBoxWriteView {
	const headerSize = 8
	const fullBoxSize = 4

	let contentSize: number

	if (box.version === 0) {
		// version 0: scheme_id_uri, value, timescale, presentation_time_delta, event_duration, id, message_data
		contentSize = (box.schemeIdUri.length + 1) + (box.value.length + 1) + 4 + 4 + 4 + 4 + box.messageData.length
	} else {
		// version 1: timescale, presentation_time, event_duration, id, scheme_id_uri, value, message_data
		contentSize = 4 + 8 + 4 + 4 + (box.schemeIdUri.length + 1) + (box.value.length + 1) + box.messageData.length
	}

	const totalSize = headerSize + fullBoxSize + contentSize

	const writer = new IsoBoxWriteView('emsg', totalSize)
	writer.writeFullBox(box.version, box.flags)

	if (box.version === 0) {
		writer.writeTerminatedString(box.schemeIdUri)
		writer.writeTerminatedString(box.value)
		writer.writeUint(box.timescale, 4)
		writer.writeUint(box.presentationTimeDelta ?? 0, 4)
		writer.writeUint(box.eventDuration, 4)
		writer.writeUint(box.id, 4)
	} else {
		writer.writeUint(box.timescale, 4)
		writer.writeUint(box.presentationTime ?? 0, 8)
		writer.writeUint(box.eventDuration, 4)
		writer.writeUint(box.id, 4)
		writer.writeTerminatedString(box.schemeIdUri)
		writer.writeTerminatedString(box.value)
	}

	writer.writeBytes(box.messageData)

	return writer
}
