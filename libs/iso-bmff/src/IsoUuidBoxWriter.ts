import type { IsoBoxWriteCursor } from './IsoBoxWriteCursor.ts'
import type { IsoCustomUuidBoxMap } from './IsoCustomUuidBoxMap.ts'

/**
 * A function that writes the fields of one `uuid` box after its user type, for `createUuidWriter`.
 *
 * The box header and the 16 bytes of `usertype` are already written. After the function, `createUuidWriter` writes the size.
 *
 * @public
 */
export type IsoUuidBoxWriter<U extends keyof IsoCustomUuidBoxMap> = (
	cursor: IsoBoxWriteCursor,
	box: IsoCustomUuidBoxMap[U],
) => void

/**
 * Map of each user type of `IsoCustomUuidBoxMap` to the writer of that `uuid` box.
 *
 * @public
 */
export type IsoUuidBoxWriterMap = {
	[U in keyof IsoCustomUuidBoxMap]?: IsoUuidBoxWriter<U>
}
