import { parseUserType } from '../cursor/parseUserType.ts'
import { writeBytes } from '../cursor/writeBytes.ts'
import { beginIsoBox } from '../beginIsoBox.ts'
import { endIsoBox } from '../endIsoBox.ts'
import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { IsoBoxWriter } from '../IsoBoxWriter.ts'
import type { IsoUuidBox } from '../IsoUuidBox.ts'
import type { IsoUuidBoxWriterMap } from '../IsoUuidBoxWriter.ts'

type UuidWriter = { w(cursor: IsoBoxWriteCursor, box: IsoUuidBox): void }['w']

/**
 * Creates the writer of the `uuid` key of a writers map. The writer selects a writer of `writers` by the `userType` field of the box.
 *
 * The writer writes the box header and the 16 bytes of `usertype`. It then calls the writer of that user type, and writes the size.
 *
 * @param writers - Map of each user type to the writer of that box.
 * @returns The writer of the `uuid` key.
 *
 * @throws RangeError if a key of `writers` is not a UUID in lowercase hexadecimal digits with hyphens.
 *
 * @example
 * {@includeCode ../../test/createUuidReader.test.ts#example}
 *
 * @public
 */
export function createUuidWriter(writers: IsoUuidBoxWriterMap): IsoBoxWriter<IsoUuidBox> {
	const map = new Map<string, { bytes: Uint8Array; writer: UuidWriter }>()

	for (const key of Object.keys(writers) as (keyof IsoUuidBoxWriterMap)[]) {
		const writer: UuidWriter | undefined = writers[key]

		if (writer) {
			map.set(key, { bytes: parseUserType('createUuidWriter', key), writer })
		}
	}

	return (cursor, box) => {
		const { userType } = box as { userType: string }
		const entry = map.get(userType)

		if (!entry) {
			throw new Error(`No writer found for box type: uuid, user type ${userType}`)
		}

		const start = beginIsoBox(cursor, 'uuid')
		writeBytes(cursor, entry.bytes)
		entry.writer(cursor, box)
		endIsoBox(cursor, start)
	}
}
