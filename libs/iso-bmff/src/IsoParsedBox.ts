import type { Box } from './boxes/Box.ts'
import type { IsoBox } from './IsoBox.ts'

/**
 * Iso Parsed Box Type
 *
 * @public
 */
export type IsoParsedBox<T extends IsoBox = IsoBox> = T & Omit<Box, 'type'>
