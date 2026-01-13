/**
 * ByteRange utility functions for converting between different formats
 * @alpha
 */

export type ByteRangeObject = {
	start: number;
	end: number;
};

/**
 * Parses a byteRange string in either HLS format (length@offset) or DASH format (start-end)
 * and converts it to an object with start and end properties.
 *
 * @param byteRangeString - String in format "length@offset" or "start-end"
 * @returns Object with start and end properties, or undefined if input is invalid
 *
 * @example
 * ```ts
 * parseByteRangeString("1234@0")    // { start: 0, end: 1233 }
 * parseByteRangeString("0-1233")    // { start: 0, end: 1233 }
 * ```
 *
 * @alpha
 */
export function parseByteRangeString(byteRangeString: string | undefined): ByteRangeObject | undefined {
	if (!byteRangeString) {
		return undefined
	}

	// HLS format: "length@offset"
	if (byteRangeString.includes('@')) {
		const [lengthStr, offsetStr] = byteRangeString.split('@')
		const length = parseInt(lengthStr, 10)
		const offset = parseInt(offsetStr, 10)

		if (isNaN(length) || isNaN(offset)) {
			return undefined
		}

		return {
			start: offset,
			end: offset + length - 1,
		}
	}

	// DASH format: "start-end"
	if (byteRangeString.includes('-')) {
		const [startStr, endStr] = byteRangeString.split('-')
		const start = parseInt(startStr, 10)
		const end = parseInt(endStr, 10)

		if (isNaN(start) || isNaN(end)) {
			return undefined
		}

		return { start, end }
	}

	return undefined
}

/**
 * Converts a ByteRangeObject to HLS format string (length@offset)
 *
 * @param byteRange - Object with start and end properties
 * @returns String in format "length@offset"
 *
 * @example
 * ```ts
 * byteRangeToHlsString({ start: 0, end: 1233 })  // "1234@0"
 * ```
 *
 * @alpha
 */
export function byteRangeToHlsString(byteRange: ByteRangeObject | undefined): string {
	if (!byteRange) {
		return ''
	}

	const length = byteRange.end - byteRange.start + 1
	const offset = byteRange.start

	return `${length}@${offset}`
}

/**
 * Converts a ByteRangeObject to DASH format string (start-end)
 *
 * @param byteRange - Object with start and end properties
 * @returns String in format "start-end"
 *
 * @example
 * ```ts
 * byteRangeToDashString({ start: 0, end: 1233 })  // "0-1233"
 * ```
 *
 * @alpha
 */
export function byteRangeToDashString(byteRange: ByteRangeObject | undefined): string {
	if (!byteRange) {
		return ''
	}

	return `${byteRange.start}-${byteRange.end}`
}

/**
 * Converts HLS Byterange object (with length and offset) to ByteRangeObject
 *
 * @param byterange - Object with length and offset properties (from HLS parser)
 * @returns Object with start and end properties
 *
 * @example
 * ```ts
 * hlsByterangeToByteRangeObject({ length: 1234, offset: 0 })  // { start: 0, end: 1233 }
 * ```
 *
 * @alpha
 */
export function hlsByterangeToByteRangeObject(byterange: { length: number; offset: number } | undefined): ByteRangeObject | undefined {
	if (!byterange) {
		return undefined
	}

	return {
		start: byterange.offset,
		end: byterange.offset + byterange.length - 1,
	}
}
