import type { IsoCustomUuidBoxMap } from './IsoCustomUuidBoxMap.ts'

/**
 * The union of the `uuid` box types of `IsoCustomUuidBoxMap`. With no declaration, the type is `never`.
 *
 * @public
 */
export type IsoUuidBox = IsoCustomUuidBoxMap[keyof IsoCustomUuidBoxMap]
