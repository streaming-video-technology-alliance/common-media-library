import type { Byterange } from '../../../../types/mapper/hls/Byterange.ts'

/**
 * Get byterange from HLS Manifest.
 *
 * @param byteRange - Byterange object containing length and offset
 * @returns string containing the byterange. If byterange is undefined, it returns undefined
 *
 * @alpha
 */
export function decodeByteRange(byteRange: Byterange | undefined): string {
	if (!byteRange) {
		return ''
	}
	return `${byteRange.length}@${byteRange.offset}`
}
