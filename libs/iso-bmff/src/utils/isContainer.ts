import type { Box } from '../boxes/Box.ts'
import type { IsoBox } from '../IsoBox.ts'
import type { IsoBoxContainer } from '../IsoBoxContainer.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { CONTAINERS } from './CONTAINERS.ts'

/**
 * Check if a box is a container
 *
 * In TypeScript, a `true` result narrows the box to the container types in the type of the box.
 * Each child in `boxes` then has a box type.
 * A 64-bit integer field of a child has the type of the `int64` option.
 * If the type of the box includes no container type, the box narrows to every container type.
 *
 * @param box - The box to check
 *
 * @returns `true` if the box is a container, `false` otherwise
 *
 * @example
 * {@includeCode ../../test/isContainer.test.ts#example}
 *
 * @public
 */
export function isContainer<T extends IsoBox<IsoInt64> | Box<IsoBox['type']>>(
	box: T,
): box is [Extract<T, IsoBoxContainer<IsoInt64>>] extends [never]
	? T & IsoBoxContainer<IsoInt64>
	: Extract<T, IsoBoxContainer<IsoInt64>> {
	return 'boxes' in box || CONTAINERS.includes(box.type)
}
