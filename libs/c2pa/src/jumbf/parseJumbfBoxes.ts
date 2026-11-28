import { readRootBoxes } from '../bmff/readRootBoxes.ts'
import type { JumbfBox } from './JumbfBox.ts'

/**
 * Parses JUMBF boxes (ISO 19566-5) from raw bytes.
 *
 * JUMBF boxes share the same 4-byte size + 4-byte type structure as ISO BMFF boxes.
 * The payload of every box is the box content after the header, whatever the box type.
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
	return readRootBoxes(bytes).map(box => ({
		type: box.type,
		data: box.bytes.subarray(box.headerSize),
	}))
}
