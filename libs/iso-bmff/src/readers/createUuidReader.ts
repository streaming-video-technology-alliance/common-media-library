import { isUserType } from '../cursor/isUserType.ts'
import { parseUserType } from '../cursor/parseUserType.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import type { IsoUuidBox } from '../IsoUuidBox.ts'
import type { IsoUuidBoxReaderMap } from '../IsoUuidBoxReader.ts'

type UuidReader<V extends IsoInt64> = {
	r(cursor: IsoBoxReadCursor<V>, userType: string): IsoUuidBox
}['r']

/**
 * Creates the reader of the `uuid` key of a readers map. The reader selects a reader of `readers` by the user type of the box.
 *
 * The reader reads the 16 bytes of `usertype` and calls the reader of that user type with the user type as a string.
 * For a user type with no reader, the reader returns `undefined`, and `readIsoBoxes` returns a raw box.
 *
 * A package that reads its own `uuid` boxes can export its readers map. A caller then joins the maps of several packages in one call:
 * `createUuidReader({ ...readersA, ...readersB })`.
 *
 * @param readers - Map of each user type to the reader of that box.
 * @returns The reader of the `uuid` key.
 *
 * @throws RangeError if a key of `readers` is not a UUID in lowercase hexadecimal digits with hyphens.
 *
 * @example
 * {@includeCode ../../test/createUuidReader.test.ts#example}
 *
 * @public
 */
export function createUuidReader<V extends IsoInt64 = number>(
	readers: IsoUuidBoxReaderMap<V>,
): (cursor: IsoBoxReadCursor<V>) => IsoUuidBox | undefined {
	const keys: string[] = []
	const values: Uint8Array[] = []
	const functions: UuidReader<V>[] = []

	for (const key of Object.keys(readers) as (keyof IsoUuidBoxReaderMap<V>)[]) {
		const reader: UuidReader<V> | undefined = readers[key]

		if (reader) {
			keys.push(key)
			values.push(parseUserType('createUuidReader', key))
			functions.push(reader)
		}
	}

	return cursor => {
		const { view, pos } = cursor

		if (pos + 16 > cursor.end) {
			return undefined
		}

		for (let i = 0; i < keys.length; i++) {
			if (isUserType(view, pos, values[i])) {
				cursor.pos = pos + 16

				return functions[i](cursor, keys[i])
			}
		}

		return undefined
	}
}
