import type { Box } from '../boxes/Box.ts'
import type { IsoBox } from '../IsoBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import type { IsoRawBox } from '../IsoRawBox.ts'
import { CONTAINERS } from './CONTAINERS.ts'

/**
 * Check if a box is a container
 *
 * The function returns `true` for a box with a `boxes` field and for a box with a type in `CONTAINERS`.
 *
 * In TypeScript, a `true` result narrows the box to the box types in the type of the box that have a `boxes` field.
 * These types are the container types, `meta`, `stsd`, `dref`, `prsl`, and the sample entries.
 * A 64-bit integer field of a child has the type of the `int64` option.
 * If the type of the box includes no type with a `boxes` field, the box narrows to every box type with a `boxes` field.
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
export function isContainer<T extends IsoBox<IsoInt64> | Box<IsoBox['type']> | IsoRawBox>(
	box: T,
): box is [Extract<T, { boxes: unknown }>] extends [never]
	? T & Extract<IsoBox<IsoInt64>, { boxes: unknown }>
	: Extract<T, { boxes: unknown }> {
	return 'boxes' in box || CONTAINERS.includes(box.type)
}
