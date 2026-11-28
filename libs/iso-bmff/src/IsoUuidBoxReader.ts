import type { IsoBoxReadCursor } from './IsoBoxReadCursor.ts'
import type { IsoCustomUuidBoxMap } from './IsoCustomUuidBoxMap.ts'
import type { IsoInt64 } from './IsoInt64.ts'

/**
 * A function that reads the fields of one `uuid` box after its user type, for `createUuidReader`.
 *
 * The position of the cursor is the first byte after the 16 bytes of `usertype`.
 * The result is the complete box with the fields `type` and `userType`.
 *
 * @public
 */
export type IsoUuidBoxReader<U extends keyof IsoCustomUuidBoxMap, V extends IsoInt64 = number> = (
	cursor: IsoBoxReadCursor<V>,
	userType: U,
) => IsoCustomUuidBoxMap[U]

/**
 * Map of each user type of `IsoCustomUuidBoxMap` to the reader of that `uuid` box.
 *
 * If `IsoCustomUuidBoxMap` is empty, a key is any string. A reader then returns a box with `type: 'uuid'` and a `userType` string.
 *
 * @public
 */
export type IsoUuidBoxReaderMap<V extends IsoInt64 = number> = [keyof IsoCustomUuidBoxMap] extends [
	never,
]
	? Record<
			string,
			| {
					r(cursor: IsoBoxReadCursor<V>, userType: string): { type: 'uuid'; userType: string }
			  }['r']
			| undefined
		>
	: { [U in keyof IsoCustomUuidBoxMap]?: IsoUuidBoxReader<U, V> }
