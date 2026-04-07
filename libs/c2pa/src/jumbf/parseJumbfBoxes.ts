import { readIsoBoxes } from '@svta/cml-iso-bmff'
import type { JumbfBox } from './JumbfBox.ts'

/**
 * Parses JUMBF boxes (ISO 19566-5) from raw bytes.
 *
 * JUMBF boxes share the same 4-byte size + 4-byte type structure as ISO BMFF boxes,
 * so they can be parsed with the same reader.
 *
 * @param bytes - Raw bytes containing JUMBF box content
 * @returns Array of parsed JUMBF boxes with their payloads
 *
 * @example
 * {@includeCode ../../test/jumbf/parseJumbfBoxes.test.ts#example}
 *
 * @internal
 */
export function parseJumbfBoxes(bytes: Uint8Array): JumbfBox[] {
	return readIsoBoxes(bytes).map(box => ({
		type: box.type,
		data: box.view.readData(box.view.bytesRemaining),
	}))
}
