import type { ParsedIsoBox } from './ParsedIsoBox.ts'
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
 * @returns An array of boxes that satisfy the callback
 *
 * @example
 * {@includeCode ../test/filterIsoBoxes.test.ts#example}
 *
 * @public
 */
export function filterIsoBoxes<T extends ParsedIsoBox>(boxes: Iterable<T>, callback: (box: T) => boolean, config?: TraverseIsoBoxesConfig): T[] {
	const result: T[] = []

	for (const box of traverseIsoBoxes(boxes as Iterable<ParsedIsoBox>, config)) {
		if (callback(box as T)) {
			result.push(box as T)
		}
	}

	return result
}
