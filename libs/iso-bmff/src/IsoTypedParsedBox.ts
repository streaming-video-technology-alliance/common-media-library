import type { IsoBoxMap } from './IsoBoxMap.ts'
import type { ParsedBox } from './ParsedBox.ts'

/**
 * Typed Parsed Box Type
 *
 * @public
 */
export type IsoTypedParsedBox<T extends keyof IsoBoxMap> = ParsedBox<IsoBoxMap[T]>
