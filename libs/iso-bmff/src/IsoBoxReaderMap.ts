import type { IsoBoxMap } from './IsoBoxMap.ts'
import type { IsoBoxReadCursor } from './IsoBoxReadCursor.ts'
import type { IsoBoxReader } from './IsoBoxReader.ts'
import type { IsoBoxType } from './IsoBoxType.ts'
import type { IsoInt64 } from './IsoInt64.ts'

/**
 * Map of each box type to the reader of that box.
 *
 * The map lists the known box types for completion. A reader under the key of another known box type is a compile error.
 * A custom key takes any reader. The index signature takes the type argument as `never` and declares the reader with a method signature,
 * so a map of known readers stays assignable to the map type after a spread. The keys `url` and `urn` find the readers of `'url '` and `'urn '`.
 *
 * @public
 */
export type IsoBoxReaderMap<V extends IsoInt64 = number> = {
	[K in keyof IsoBoxMap]?: IsoBoxReader<{ type: K }, V>
} & {
	url?: IsoBoxReader<{ type: 'url ' }, V>
	urn?: IsoBoxReader<{ type: 'urn ' }, V>
} & Record<IsoBoxType, { r(cursor: IsoBoxReadCursor<V>, type: never): { type: IsoBoxType } }['r']>
