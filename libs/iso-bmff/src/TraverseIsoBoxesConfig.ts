/**
 * Configuration options for traversing ISO boxes.
 *
 * @public
 */
export type TraverseIsoBoxesConfig = {
	/**
	 * Whether to traverse the boxes depth-first or breadth-first.
	 *
	 * @defaultValue true
	 */
	depthFirst?: boolean

	/**
	 * The maximum depth to traverse. A value of 0 will only traverse the root boxes.
	 *
	 * @defaultValue Infinity
	 */
	maxDepth?: number
}
