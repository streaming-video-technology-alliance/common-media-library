import type { IsoBoxMap } from './IsoBoxMap.ts'
import type { IsoBoxType } from './IsoBoxType.ts'
import type { IsoBoxWriter } from './IsoBoxWriter.ts'
import type { IsoInt64 } from './IsoInt64.ts'

/**
 * Map of each box type to the writer of that box.
 *
 * The map lists the known box types for completion. A writer under the key of another known box type is a compile error.
 * A custom key takes any writer. The keys `url` and `urn` find the writers of `'url '` and `'urn '`.
 *
 * @public
 */
export type IsoBoxWriterMap = {
	[K in keyof IsoBoxMap]?: IsoBoxWriter<IsoBoxMap<IsoInt64>[K]>
} & {
	url?: IsoBoxWriter<IsoBoxMap<IsoInt64>['url ']>
	urn?: IsoBoxWriter<IsoBoxMap<IsoInt64>['urn ']>
} & Record<IsoBoxType, IsoBoxWriter<never>>
