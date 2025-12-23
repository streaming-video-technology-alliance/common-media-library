import type { Fields } from '../boxes/Fields.ts'
import type { EventMessageBox } from '../boxes/EventMessageBox.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'
import { writeFullBox } from './writeFullBox.ts'
import { writeString } from './writeString.ts'
import { writeUint } from './writeUint.ts'

/**
 * Write an EventMessageBox to a Uint8Array.
 *
 * ISO/IEC 23009-1 - 5.10.3.3 Event Message Box
 *
 * @param box - The EventMessageBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeEmsg(box: Fields<EventMessageBox>): Uint8Array {
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

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)
	const result = new Uint8Array(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'emsg', totalSize)
	offset += writeFullBox(dataView, offset, box.version, box.flags)

	if (box.version === 0) {
		writeString(dataView, offset, box.schemeIdUri)
		offset += box.schemeIdUri.length
		dataView.setUint8(offset, 0) // null terminator
		offset += 1

		writeString(dataView, offset, box.value)
		offset += box.value.length
		dataView.setUint8(offset, 0) // null terminator
		offset += 1

		writeUint(dataView, offset, 4, box.timescale)
		offset += 4

		writeUint(dataView, offset, 4, box.presentationTimeDelta ?? 0)
		offset += 4

		writeUint(dataView, offset, 4, box.eventDuration)
		offset += 4

		writeUint(dataView, offset, 4, box.id)
		offset += 4
	} else {
		writeUint(dataView, offset, 4, box.timescale)
		offset += 4

		writeUint(dataView, offset, 8, box.presentationTime ?? 0)
		offset += 8

		writeUint(dataView, offset, 4, box.eventDuration)
		offset += 4

		writeUint(dataView, offset, 4, box.id)
		offset += 4

		writeString(dataView, offset, box.schemeIdUri)
		offset += box.schemeIdUri.length
		dataView.setUint8(offset, 0) // null terminator
		offset += 1

		writeString(dataView, offset, box.value)
		offset += box.value.length
		dataView.setUint8(offset, 0) // null terminator
		offset += 1
	}

	result.set(box.messageData, offset)

	return result
}

