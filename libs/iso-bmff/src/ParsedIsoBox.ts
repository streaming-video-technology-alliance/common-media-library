import type { Box } from './boxes/Box.ts'
import type { IsoBox } from './IsoBox.ts'
import type { IsoInt64 } from './IsoInt64.ts'
import type { ParsedBox } from './ParsedBox.ts'

/**
 * Parsed Box Type
 *
 * @public
 */
export type ParsedIsoBox<V extends IsoInt64 = number> = ParsedBox<IsoBox<V> | Box, V>
