import type { IsoBoxMap } from './IsoBoxMap.ts'
import type { IsoBoxReadCursor } from './IsoBoxReadCursor.ts'
import type { IsoBoxReader } from './IsoBoxReader.ts'
import type { IsoInt64 } from './IsoInt64.ts'
import type { IsoUuidBox } from './IsoUuidBox.ts'

/**
 * Map of each box type to the reader of that box.
 *
 * The map takes a key of `IsoBoxMap` only. A reader under a key returns the box type of that key, and can add fields.
 * To use a reader of a box type that the package does not name, add the box type to `IsoCustomBoxMap`.
 * The keys `url` and `urn` find the readers of `'url '` and `'urn '`.
 *
 * The reader of `uuid` can also return `undefined`. `readIsoBoxes` then returns a raw box.
 * `createUuidReader` creates that reader from a map of user types.
 *
 * @public
 */
export type IsoBoxReaderMap<V extends IsoInt64 = number> = {
	[K in Exclude<keyof IsoBoxMap, 'uuid'>]?: IsoBoxReader<IsoBoxMap<V>[K], V>
} & {
	url?: IsoBoxReader<IsoBoxMap<V>['url '], V>
	urn?: IsoBoxReader<IsoBoxMap<V>['urn '], V>
	uuid?: { r(cursor: IsoBoxReadCursor<V>, type: 'uuid'): IsoUuidBox | undefined }['r']
}
