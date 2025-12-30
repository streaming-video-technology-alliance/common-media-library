import type { Box } from './boxes/Box.ts'
import type { IsoBoxMap } from './IsoBoxMap.ts'

/**
 * Typed Parsed Box Type
 *
 * @public
 */
export type IsoTypedParsedBox<T extends keyof IsoBoxMap> = IsoBoxMap[T] & Omit<Box, 'type'>
