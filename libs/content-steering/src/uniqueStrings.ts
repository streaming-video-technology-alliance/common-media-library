/**
 * Returns the strings of a list without duplicates, in their first order.
 *
 * @param list - The list.
 * @returns The strings of the list.
 *
 * @internal
 */
export function uniqueStrings(list: readonly unknown[]): string[] {
	const result: string[] = []

	for (const item of list) {
		if (typeof item === 'string' && !result.includes(item)) {
			result.push(item)
		}
	}

	return result
}
