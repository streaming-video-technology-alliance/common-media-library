import type { IsoBoxMap } from './IsoBoxMap.ts'
import type { IsoBoxWriter } from './IsoBoxWriter.ts'
import type { IsoInt64 } from './IsoInt64.ts'

/**
 * Map of each box type to the writer of that box.
 *
 * The map takes a key of `IsoBoxMap` only. A writer under a key takes the box type of that key.
 * To use a writer of a box type that the package does not name, add the box type to `IsoCustomBoxMap`.
 * The keys `url` and `urn` find the writers of `'url '` and `'urn '`.
 *
 * @public
 */
export type IsoBoxWriterMap = {
	[K in keyof IsoBoxMap]?: IsoBoxWriter<IsoBoxMap<IsoInt64>[K]>
} & {
	url?: IsoBoxWriter<IsoBoxMap<IsoInt64>['url ']>
	urn?: IsoBoxWriter<IsoBoxMap<IsoInt64>['urn ']>
}
