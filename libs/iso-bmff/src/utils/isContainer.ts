import type { Box } from '../boxes/Box.ts'
import type { IsoBox } from '../IsoBox.ts'
import type { IsoContainer } from '../IsoContainer.ts'
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
export function isContainer(box: IsoBox | Box): box is IsoContainer {
	return 'boxes' in box || CONTAINERS.includes(box.type)
}
