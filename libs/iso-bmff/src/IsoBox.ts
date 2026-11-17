import type { IsoBoxMap } from './IsoBoxMap.ts'
import type { IsoInt64 } from './IsoInt64.ts'

/**
 * Utility type for all ISO BMFF boxes
 *
 * @public
 */
export type IsoBox<V extends IsoInt64 = number> = IsoBoxMap<V>[keyof IsoBoxMap<V>]
