import type { Byterange } from '../../../../types/mapper/hls/Byterange.js';

/**
 * @internal
 *
 * Get byterange from HLS Manifest.
 *
 * @param byteRange - Byterange object containning length and offset
 * @returns string containing the byterange. If byterange is undefined, it returns undefined
 *
 * @group CMAF
 * @alpha
 */
export function getByterange(byteRange: Byterange | undefined): string {
	if (!byteRange) {
		return '';
	}
	return `${byteRange.length}@${byteRange.offset}`;
}
