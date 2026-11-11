import { encodeText } from '@svta/cml-utils'
import type { EventMessageBox } from '../boxes/EventMessageBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write an `EventMessageBox` to an `IsoBoxWriteView`.
 *
 * ISO/IEC 23009-1 - 5.10.3.3 Event Message Box
 *
 * @param box - The `EventMessageBox` fields to write
 *
 * @returns An `IsoBoxWriteView` containing the encoded box
 *
 * @public
 */
export function writeEmsg(box: EventMessageBox): IsoBoxWriteView {
	const schemeIdUriBytes = encodeText(box.schemeIdUri)
	const valueBytes = encodeText(box.value)

	const headerSize = 8
	const fullBoxSize = 4
	const schemeIdUriSize = schemeIdUriBytes.length + 1 // null-terminated
	const valueSize = valueBytes.length + 1 // null-terminated

	let contentSize: number

	if (box.version === 0) {
		// version 0: scheme_id_uri, value, timescale, presentation_time_delta, event_duration, id, message_data
		contentSize = schemeIdUriSize + valueSize + 4 + 4 + 4 + 4 + box.messageData.length
	} else {
		// version 1: timescale, presentation_time, event_duration, id, scheme_id_uri, value, message_data
		contentSize = 4 + 8 + 4 + 4 + schemeIdUriSize + valueSize + box.messageData.length
	}

	const totalSize = headerSize + fullBoxSize + contentSize

	const writer = new IsoBoxWriteView('emsg', totalSize)
	writer.writeFullBox(box.version, box.flags)

	if (box.version === 0) {
		writer.writeBytes(schemeIdUriBytes)
		writer.writeUint(0, 1)
		writer.writeBytes(valueBytes)
		writer.writeUint(0, 1)
		writer.writeUint(box.timescale, 4)
		writer.writeUint(box.presentationTimeDelta ?? 0, 4)
		writer.writeUint(box.eventDuration, 4)
		writer.writeUint(box.id, 4)
	} else {
		writer.writeUint(box.timescale, 4)
		writer.writeUint(box.presentationTime ?? 0, 8)
		writer.writeUint(box.eventDuration, 4)
		writer.writeUint(box.id, 4)
		writer.writeBytes(schemeIdUriBytes)
		writer.writeUint(0, 1)
		writer.writeBytes(valueBytes)
		writer.writeUint(0, 1)
	}

	writer.writeBytes(box.messageData)

	return writer
}
