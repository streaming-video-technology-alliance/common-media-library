import type { IsoBoxContainerMap } from './IsoBoxContainerMap.ts'
import type { IsoInt64 } from './IsoInt64.ts'

/**
 * Iso Box Container Type
 *
 * @public
 */
export type IsoBoxContainer<V extends IsoInt64 = number> =
	IsoBoxContainerMap<V>[keyof IsoBoxContainerMap<V>]
