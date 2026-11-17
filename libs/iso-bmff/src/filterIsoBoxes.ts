import type { TraverseIsoBoxesConfig } from './TraverseIsoBoxesConfig.ts'
import { traverseIsoBoxes } from './traverseIsoBoxes.ts'

/**
 * Filters boxes in the tree that satisfy the provided testing function.
 *
 * This function traverses the entire box structure (including nested boxes)
 * and returns all boxes for which the callback returns true.
 *
 * @param boxes - The boxes to search through
 * @param callback - A function that accepts a box and returns true if it matches
 * @param config - Configuration options for traversal
 *
 * @returns An array of boxes that satisfy the callback, narrowed to the type `S` of the type guard
 *
 * @example
 * {@includeCode ../test/filterIsoBoxes.test.ts#example}
 *
 * @public
 */
export function filterIsoBoxes<T, S extends T>(
	boxes: Iterable<T>,
	callback: (box: T) => box is S,
	config?: TraverseIsoBoxesConfig,
): S[]

/**
 * Filters boxes in the tree for which a `boolean` callback returns true.
 *
 * Use the other overload with a type guard callback to narrow the result.
 *
 * @param boxes - The boxes to search through
 * @param callback - A function that accepts a box and returns true if it matches
 * @param config - Configuration options for traversal
 *
 * @returns An array of boxes that satisfy the callback, with the input type `T`
 *
 * @public
 */
export function filterIsoBoxes<T>(
	boxes: Iterable<T>,
	callback: (box: T) => boolean,
	config?: TraverseIsoBoxesConfig,
): T[]
export function filterIsoBoxes<T>(
	boxes: Iterable<T>,
	callback: (box: T) => boolean,
	config?: TraverseIsoBoxesConfig,
): T[] {
	const result: T[] = []

	for (const box of traverseIsoBoxes(boxes, config)) {
		if (callback(box)) {
			result.push(box)
		}
	}

	return result
}
