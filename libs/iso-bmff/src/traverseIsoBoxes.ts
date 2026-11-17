import type { TraverseIsoBoxesConfig } from './TraverseIsoBoxesConfig.ts'

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
export function* traverseIsoBoxes<T>(
	boxes: Iterable<T>,
	config?: TraverseIsoBoxesConfig,
): Generator<T> {
	const depthFirst = config?.depthFirst ?? true
	const maxDepth = config?.maxDepth ?? Infinity

	if (maxDepth < 0 || typeof maxDepth !== 'number' || Number.isNaN(maxDepth)) {
		return
	}

	const limit = depthFirst ? Math.floor(maxDepth) : maxDepth
	const iterators: [Iterator<T>, number][] = [[boxes[Symbol.iterator](), 0]]
	let head = 0

	try {
		while (head < iterators.length) {
			const index = depthFirst ? iterators.length - 1 : head
			const [iterator, depth] = iterators[index]
			const result = iterator.next()

			if (result.done) {
				if (depthFirst) {
					iterators.pop()
				} else {
					head++
				}
				continue
			}

			const child = result.value
			yield child

			if (depth < limit) {
				const children = (child as { boxes?: Iterable<T> }).boxes

				if (children) {
					iterators.push([children[Symbol.iterator](), depth + 1])
				}
			}
		}
	} finally {
		for (let i = iterators.length - 1; i >= head; i--) {
			iterators[i][0].return?.()
		}
	}
}
