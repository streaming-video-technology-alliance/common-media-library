import type { IsoBoxMap } from './IsoBoxMap.ts'
import type { IsoInt64 } from './IsoInt64.ts'
import type { ParsedBox } from './ParsedBox.ts'

/**
 * Typed Parsed Box Type
 *
 * @public
 */
export type IsoTypedParsedBox<T extends keyof IsoBoxMap, V extends IsoInt64 = number> = ParsedBox<
	IsoBoxMap<V>[T],
	V
>
