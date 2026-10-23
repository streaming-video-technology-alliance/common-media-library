/**
 * Returns the mean of the recorded first-byte waits, in seconds, or 0 when there are none.
 *
 * @param waits - The first-byte waits of the last finished downloads, in seconds
 * @returns The mean wait in seconds
 */
export function averageFirstByteWait(waits: readonly number[]): number {
	if (waits.length === 0) {
		return 0
	}

	let sum = 0

	for (const wait of waits) {
		sum += wait
	}

	return sum / waits.length
}
