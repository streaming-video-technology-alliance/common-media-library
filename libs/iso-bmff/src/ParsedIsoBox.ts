import type { Box } from './boxes/Box.ts'
import type { IsoBox } from './IsoBox.ts'
import type { ParsedBox } from './ParsedBox.ts'

/**
 * Parsed Box Type
 *
 * @public
 */
export type ParsedIsoBox = ParsedBox<IsoBox | Box>
