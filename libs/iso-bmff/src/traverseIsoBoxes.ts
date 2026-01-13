import type { Box } from './boxes/Box.ts'
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
export function* traverseIsoBoxes<T>(boxes: Iterable<T>, config?: TraverseIsoBoxesConfig): Generator<T> {
	const depthFirst = config?.depthFirst ?? true
	const maxDepth = config?.maxDepth ?? Infinity

	if (maxDepth < 0 || typeof maxDepth !== 'number' || Number.isNaN(maxDepth)) {
		return
	}

	const queue: [Iterable<T>, number][] = [[boxes, 0]]

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

			const box = child as Box
			if (isContainer(box) && box.boxes) {
				const next = box.boxes as T[]

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
