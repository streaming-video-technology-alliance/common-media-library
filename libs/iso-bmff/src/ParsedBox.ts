import type { Box } from './boxes/Box.ts'
import type { IsoBox } from './IsoBox.ts'
import type { IsoBoxReadView } from './IsoBoxReadView.ts'

/**
 * A Parsed Box Type
 *
 * @public
 */
export type ParsedBox<T = Box> = (T extends IsoBox ? T & Omit<Box, 'type'> : T) & {
	view: IsoBoxReadView
	size: number;
	largesize?: number;
	usertype?: number[];
}
