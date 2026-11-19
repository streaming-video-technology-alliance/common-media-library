import { isIsoBoxType, readEmsg, readIsoBoxes, type EventMessageBox } from '@svta/cml-iso-bmff'

const VSI_SCHEME_URI = 'urn:c2pa:verifiable-segment-info'
const EMSG_READER_CONFIG = { readers: { emsg: readEmsg } }

/**
 * Finds and parses the first C2PA Verifiable Segment Info (VSI) EMSG box
 * in a DASH segment, identified by scheme URI `urn:c2pa:verifiable-segment-info`.
 *
 * @param segmentBytes - Raw DASH segment bytes
 * @returns The parsed VSI EMSG box, or `null` if not found
 *
 * @example
 * {@includeCode ../../test/emsg/extractVsiEmsgBox.test.ts#example}
 *
 * @internal
 */
export function extractVsiEmsgBox(segmentBytes: Uint8Array): EventMessageBox | null {
	for (const box of readIsoBoxes(segmentBytes, EMSG_READER_CONFIG)) {
		if (isIsoBoxType('emsg', box) && box.schemeIdUri === VSI_SCHEME_URI) return box
	}
	return null
}
