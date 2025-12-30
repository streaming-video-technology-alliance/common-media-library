import type { ParsedBox } from './ParsedBox.ts'
import { isContainer } from './utils/isContainer.ts'

/**
 * Traverse ISO boxes
 *
 * @param boxes - The boxes to traverse
 * @param depthFirst - Whether to traverse the boxes depth-first or breadth-first
 * @param maxDepth - The maximum depth to traverse. A value of 0 will only traverse the root boxes.
 *
 * @returns A generator of boxes
 *
 * @example
 * {@includeCode ../test/traverseIsoBoxes.test.ts#example}
 *
 * @public
 */
export function* traverseIsoBoxes(boxes: Iterable<ParsedBox>, depthFirst: boolean = true, maxDepth: number = Infinity): Generator<ParsedBox> {
	if (maxDepth < 0 || typeof maxDepth !== 'number' || Number.isNaN(maxDepth)) {
		return
	}

	const queue: [Iterable<ParsedBox>, number][] = [[boxes, 0]]

	while (queue.length > 0) {
		const item = queue.shift()
		if (!item) {
			continue
		}
		const [children, depth] = item

		for (const child of children) {
			yield child

			if (depth >= maxDepth) {
				continue
			}

			if (isContainer(child) && child.boxes) {
				const next = child.boxes as ParsedBox[]

				if (depthFirst) {
					yield* traverseIsoBoxes(next, depthFirst, maxDepth - 1)
				}
				else {
					queue.push([next, depth + 1])
				}
			}
		}
	}
}
