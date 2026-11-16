import { encodeText } from '@svta/cml-utils'
import type { IsoInt64 } from '../IsoInt64.ts'
import type {
	EventMessageBox,
	EventMessageBoxV0,
	EventMessageBoxV1,
} from '../boxes/EventMessageBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write an `EventMessageBox` to an `IsoBoxWriteView`.
 *
 * ISO/IEC 23009-1 - 5.10.3.3 Event Message Box
 *
 * Each 64-bit integer field of the box is a `number` or a `bigint`.
 * The writer throws a `RangeError` for a `bigint` that does not fit the field.
 *
 * For a version other than 0 or 1, the writer writes the full box fields and `messageData` only.
 *
 * @param box - The `EventMessageBox` fields to write
 *
 * @returns An `IsoBoxWriteView` containing the encoded box
 *
 * @public
 */
export function writeEmsg(box: EventMessageBox<IsoInt64>): IsoBoxWriteView {
	const { version, flags, messageData } = box
	const fields = box as EventMessageBoxV0 | EventMessageBoxV1<IsoInt64>
	const hasFields = version === 0 || version === 1
	const schemeIdUriBytes = encodeText(hasFields ? fields.schemeIdUri : '')
	const valueBytes = encodeText(hasFields ? fields.value : '')

	const headerSize = 8
	const fullBoxSize = 4
	const schemeIdUriSize = schemeIdUriBytes.length + 1 // null-terminated
	const valueSize = valueBytes.length + 1 // null-terminated

	let contentSize = messageData.length

	if (version === 0) {
		// version 0: scheme_id_uri, value, timescale, presentation_time_delta, event_duration, id, message_data
		contentSize += schemeIdUriSize + valueSize + 4 + 4 + 4 + 4
	} else if (version === 1) {
		// version 1: timescale, presentation_time, event_duration, id, scheme_id_uri, value, message_data
		contentSize += 4 + 8 + 4 + 4 + schemeIdUriSize + valueSize
	}

	const totalSize = headerSize + fullBoxSize + contentSize

	const writer = new IsoBoxWriteView('emsg', totalSize)
	writer.writeFullBox(version, flags)

	if (fields.version === 0) {
		writer.writeBytes(schemeIdUriBytes)
		writer.writeUint(0, 1)
		writer.writeBytes(valueBytes)
		writer.writeUint(0, 1)
		writer.writeUint(fields.timescale, 4)
		writer.writeUint(fields.presentationTimeDelta ?? 0, 4)
		writer.writeUint(fields.eventDuration, 4)
		writer.writeUint(fields.id, 4)
	} else if (fields.version === 1) {
		writer.writeUint(fields.timescale, 4)
		writer.writeWideUint(fields.presentationTime ?? 0, 8)
		writer.writeUint(fields.eventDuration, 4)
		writer.writeUint(fields.id, 4)
		writer.writeBytes(schemeIdUriBytes)
		writer.writeUint(0, 1)
		writer.writeBytes(valueBytes)
		writer.writeUint(0, 1)
	}

	writer.writeBytes(messageData)

	return writer
}
