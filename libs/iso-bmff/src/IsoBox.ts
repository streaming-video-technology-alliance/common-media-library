import type { IsoBoxMap } from './IsoBoxMap.ts'

/**
 * Utility type for all ISO BMFF boxes
 *
 * @public
 */
export type IsoBox = IsoBoxMap[keyof IsoBoxMap];
