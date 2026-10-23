// Helper function to parse input into groups separated by 'groupDelim', and
// interpet each group as a key/value pair separated by 'keyValueDelim'.
export function parseOptions(
	input: string,
	callback: (k: string, v: string) => void,
	keyValueDelim: string | RegExp,
	groupDelim?: string | RegExp,
): void {
	// TODO: Optimize parsing to avoid creating new arrays and strings.
	const groups = groupDelim ? input.split(groupDelim) : [input]

	for (const group of groups) {
		if (typeof group !== 'string') {
			continue
		}

		const kv = group.split(keyValueDelim)
		if (kv.length !== 2) {
			continue
		}

		const k = kv[0]
		const v = kv[1].trim()

		// TODO: Return a value instead of using a callback.
		callback(k, v)
	}
}
