import { readIsoBoxes } from '@svta/cml-iso-bmff'
import type { EmsgBox } from './EmsgBox.ts'

const EMSG_BOX_TYPE = 'emsg' as const
const VSI_SCHEME_URI = 'urn:c2pa:verifiable-segment-info' as const
const FULL_BOX_HEADER_SIZE = 4 // version(1) + flags(3)
const MINIMUM_EMSG_PAYLOAD_SIZE = 12
const V0_FIXED_FIELDS_SIZE = 16 // timescale(4) + presentationTimeDelta(4) + eventDuration(4) + id(4)
const V1_FIXED_FIELDS_SIZE = 20 // timescale(4) + presentationTime(8) + eventDuration(4) + id(4)

function readNullTerminatedString(bytes: Uint8Array, offset: number): { value: string; nextOffset: number } {
	let end = offset
	while (end < bytes.length && bytes[end] !== 0x00) end++
	const value = new TextDecoder('utf-8').decode(bytes.subarray(offset, end))
	return { value, nextOffset: end + 1 }
}

function parseEmsgV0(payload: Uint8Array, view: DataView, flags: number): EmsgBox {
	let offset = FULL_BOX_HEADER_SIZE

	const schemeResult = readNullTerminatedString(payload, offset)
	offset = schemeResult.nextOffset

	const valueResult = readNullTerminatedString(payload, offset)
	offset = valueResult.nextOffset

	if (offset + V0_FIXED_FIELDS_SIZE > payload.length) throw new Error('EMSG v0 payload truncated')

	return {
		version: 0,
		flags,
		schemeIdUri: schemeResult.value,
		value: valueResult.value,
		timescale: view.getUint32(offset, false),
		presentationTimeDelta: view.getUint32(offset + 4, false),
		eventDuration: view.getUint32(offset + 8, false),
		id: view.getUint32(offset + 12, false),
		messageData: payload.slice(offset + V0_FIXED_FIELDS_SIZE),
	}
}

function parseEmsgV1(payload: Uint8Array, view: DataView, flags: number): EmsgBox {
	let offset = FULL_BOX_HEADER_SIZE

	if (offset + V1_FIXED_FIELDS_SIZE > payload.length) throw new Error('EMSG v1 payload truncated')

	const timescale = view.getUint32(offset, false)
	const presentationTime = Number(view.getBigUint64(offset + 4, false))
	const eventDuration = view.getUint32(offset + 12, false)
	const id = view.getUint32(offset + 16, false)
	offset += V1_FIXED_FIELDS_SIZE

	const schemeResult = readNullTerminatedString(payload, offset)
	offset = schemeResult.nextOffset
	const valueResult = readNullTerminatedString(payload, offset)
	offset = valueResult.nextOffset

	return {
		version: 1,
		flags,
		schemeIdUri: schemeResult.value,
		value: valueResult.value,
		timescale,
		presentationTime,
		eventDuration,
		id,
		messageData: payload.slice(offset),
	}
}

/**
 * Parses an EMSG (Event Message) box payload (ISO 14496-12 §12.6.2).
 *
 * Accepts the box payload starting with the version byte — the 8-byte
 * size+type header must not be included.
 * Supports both version 0 and version 1.
 *
 * @param payload - EMSG box payload starting with version byte
 * @returns The parsed EMSG box
 * @throws If the payload is too small or uses an unsupported version
 *
 * @example
 * {@includeCode ../../test/emsg/parseEmsgBox.test.ts#example}
 *
 * @public
 */
export function parseEmsgBox(payload: Uint8Array): EmsgBox {
	if (payload.length < MINIMUM_EMSG_PAYLOAD_SIZE) throw new Error('EMSG payload too small')

	const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength)
	const version = payload[0]
	const flags = (payload[1] << 16) | (payload[2] << 8) | payload[3]

	if (version === 0) return parseEmsgV0(payload, view, flags)
	if (version === 1) return parseEmsgV1(payload, view, flags)

	throw new Error(`Unsupported EMSG version: ${version}`)
}

/**
 * Finds and parses the first C2PA Verifiable Segment Info (VSI) EMSG box
 * in a DASH segment, identified by scheme URI `urn:c2pa:verifiable-segment-info`.
 *
 * @param segmentBytes - Raw DASH segment bytes
 * @returns The parsed VSI EMSG box, or `null` if not found
 *
 * @example
 * {@includeCode ../../test/emsg/parseEmsgBox.test.ts#example}
 *
 * @public
 */
export function extractVsiEmsgBox(segmentBytes: Uint8Array): EmsgBox | null {
	for (const box of readIsoBoxes(segmentBytes)) {
		if (box.type !== EMSG_BOX_TYPE) continue
		try {
			const payload = box.view.readData(box.view.bytesRemaining)
			const emsg = parseEmsgBox(payload)
			if (emsg.schemeIdUri === VSI_SCHEME_URI) return emsg
		} catch {
			// Skip malformed EMSG boxes and continue searching
		}
	}
	return null
}
