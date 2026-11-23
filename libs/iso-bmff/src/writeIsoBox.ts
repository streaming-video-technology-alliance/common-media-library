import type { IsoBoxStreamable } from './IsoBoxStreamable.ts'
import type { IsoBoxWriteConfig } from './IsoBoxWriteConfig.ts'
import { writeIsoBoxes } from './writeIsoBoxes.ts'

/**
 * Write an ISO box to a Uint8Array.
 *
 * @param box - The box to write
 * @param config - The optional configuration with the writers. With no writers, the function writes only byte arrays, raw boxes, and containers.
 *
 * @returns The bytes of the box, in a new array with the exact size.
 *
 * @throws Error if a box has no writer, no `bytes` field, and a type outside `CONTAINERS`. The message starts with "No writer found for box type".
 * @throws RangeError if a `bigint` field does not fit its size.
 * @throws RangeError if a four-character code of a box does not have 4 characters.
 * @throws RangeError if `writeSidx`, `writeSubs`, or `writeTenc` gets more items than the count field of the box can state.
 * @throws RangeError if a box has more than 2^32 - 1 bytes.
 *
 * @example
 * {@includeCode ../test/writeIsoBox.test.ts#example}
 *
 * @public
 */
export function writeIsoBox(
	box: IsoBoxStreamable,
	config: IsoBoxWriteConfig = {},
): Uint8Array<ArrayBuffer> {
	return writeIsoBoxes([box], config)
}
