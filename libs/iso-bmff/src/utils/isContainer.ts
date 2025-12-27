import type { Box } from '../boxes/Box.ts'
import type { ContainerBox } from '../boxes/ContainerBox.ts'
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
export function isContainer(box: Box | ContainerBox<any>): box is ContainerBox<any> {
	return 'boxes' in box || CONTAINERS.includes(box.type)
}
