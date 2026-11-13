import type { Box } from './boxes/Box.ts'
import type { IsoBox } from './IsoBox.ts'
import type { IsoBoxReadView } from './IsoBoxReadView.ts'
import type { IsoInt64 } from './IsoInt64.ts'

/**
 * A Parsed Box Type
 *
 * @public
 */
export type ParsedBox<T = Box, V extends IsoInt64 = number> = (T extends IsoBox<V>
	? T & Omit<Box, 'type'>
	: T) & {
	view: IsoBoxReadView<V>
	size: number
	largesize?: number
	usertype?: number[]
}
