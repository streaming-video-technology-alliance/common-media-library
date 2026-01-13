import type { Box } from '../boxes/Box.ts'
import type { IsoBox } from '../IsoBox.ts'
import type { IsoBoxContainer } from '../IsoBoxContainer.ts'
import { CONTAINERS } from './CONTAINERS.ts'

/**
 * Check if a box is a container
 *
 * @param box - The box to check
 *
 * @returns `true` if the box is a container, `false` otherwise
 *
 * @public
 */
export function isContainer<T extends IsoBox | Box<IsoBox['type']>>(box: T): box is T & IsoBoxContainer {
	return 'boxes' in box || CONTAINERS.includes(box.type)
}
