import type { ParsedIsoBox } from './ParsedIsoBox.ts'
import type { TraverseIsoBoxesConfig } from './TraverseIsoBoxesConfig.ts'
import { isContainer } from './utils/isContainer.ts'

/**
 * Traverse ISO boxes
 *
 * @param boxes - The boxes to traverse
 * @param config - Configuration options for traversal
 *
 * @returns A generator of boxes
 *
 * @example
 * {@includeCode ../test/traverseIsoBoxes.test.ts#example}
 *
 * @public
 */
export function* traverseIsoBoxes(boxes: Iterable<ParsedIsoBox>, config?: TraverseIsoBoxesConfig): Generator<ParsedIsoBox> {
	const depthFirst = config?.depthFirst ?? true
	const maxDepth = config?.maxDepth ?? Infinity

	if (maxDepth < 0 || typeof maxDepth !== 'number' || Number.isNaN(maxDepth)) {
		return
	}

	const queue: [Iterable<ParsedIsoBox>, number][] = [[boxes, 0]]

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
				const next = child.boxes as ParsedIsoBox[]

				if (depthFirst) {
					yield* traverseIsoBoxes(next, { depthFirst, maxDepth: maxDepth - 1 })
				}
				else {
					queue.push([next, depth + 1])
				}
			}
		}
	}
}
