import type { ContainerBox } from '../boxes/ContainerBox.ts'
import type { ParsedBox } from '../ParsedBox.ts'
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
export function isContainer<T = ParsedBox>(box: any): box is ContainerBox<T> {
	return 'boxes' in box || CONTAINERS.includes(box.type)
}
