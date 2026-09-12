/** A request URL parsed into the pieces `nor` relativization needs: the origin and the directory path segments. */
export type BaseParts = {
	readonly origin: string
	readonly dir: readonly string[]
}
