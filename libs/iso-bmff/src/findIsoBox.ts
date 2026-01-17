import type { TraverseIsoBoxesConfig } from './TraverseIsoBoxesConfig.ts'
import { traverseIsoBoxes } from './traverseIsoBoxes.ts'

/**
 * Finds the first box in the tree that satisfies the provided testing function.
 *
 * This function traverses the entire box structure (including nested boxes)
 * and returns the first box for which the callback returns true.
 *
 * @param boxes - The boxes to search through
 * @param callback - A function that accepts a box and returns true if it matches
 * @param config - Configuration options for traversal
 *
 * @returns The first box that satisfies the callback, or null if none is found
 *
 * @example
 * {@includeCode ../test/findIsoBox.test.ts#example}
 *
 * @public
 */
export function findIsoBox<T, S extends T>(boxes: Iterable<T>, callback: (box: T) => box is S, config?: TraverseIsoBoxesConfig): S | null;

/**
 * @public
 */
export function findIsoBox<T>(boxes: Iterable<T>, callback: (box: T) => boolean, config?: TraverseIsoBoxesConfig): T | null;
export function findIsoBox<T>(boxes: Iterable<T>, callback: (box: T) => boolean, config?: TraverseIsoBoxesConfig): T | null {
	for (const box of traverseIsoBoxes(boxes, config)) {
		if (callback(box)) {
			return box
		}
	}

	return null
}
