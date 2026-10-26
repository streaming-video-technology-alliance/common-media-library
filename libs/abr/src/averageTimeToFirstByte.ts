/**
 * Returns the mean time to first byte of the recorded samples, in seconds, or 0 when there are none.
 *
 * @param samples - The time to first byte of the last finished downloads, in seconds
 * @returns The mean time to first byte in seconds
 */
export function averageTimeToFirstByte(samples: readonly number[]): number {
	if (samples.length === 0) {
		return 0
	}

	let sum = 0

	for (const sample of samples) {
		sum += sample
	}

	return sum / samples.length
}
