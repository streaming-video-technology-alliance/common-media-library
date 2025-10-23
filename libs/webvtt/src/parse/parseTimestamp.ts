function computeSeconds(h: number, m: number, s: number, f: number): number {
	return (h | 0) * 3600 + (m | 0) * 60 + (s | 0) + (f | 0) / 1000
}

// Try to parse input as a time stamp.
export function parseTimeStamp(input: string): number | null {
	// TODO: Optimize parsing to avoid creating new arrays and strings.
	const m = input.match(/^(\d+):(\d{1,2})(:\d{1,2})?\.(\d{3})/)

	if (!m) {
		return null
	}

	const first = parseInt(m[1])
	const second = parseInt(m[2])
	const third = parseInt(m[3]?.replace(':', '') || '0')
	const fourth = parseInt(m[4])

	if (m[3]) {
		// Timestamp takes the form of [hours]:[minutes]:[seconds].[milliseconds]
		return computeSeconds(first, second, third, fourth)
	}
	else if (first > 59) {
		// Timestamp takes the form of [hours]:[minutes].[milliseconds]
		// First position is hours as it's over 59.
		return computeSeconds(first, second, 0, fourth)
	}
	else {
		// Timestamp takes the form of [minutes]:[seconds].[milliseconds]
		return computeSeconds(0, first, second, fourth)
	}
}
