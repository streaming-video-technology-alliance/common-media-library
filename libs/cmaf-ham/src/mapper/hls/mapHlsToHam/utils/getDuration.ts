import type { HlsManifest } from '../../../../types/mapper/hls/HlsManifest.ts'
import type { SegmentHls } from '../../../../types/mapper/hls/SegmentHls.ts'

/**
 * Calculate the duration of a track.
 *
 * `target duration * number of segments`
 *
 * @param manifest - Manifest of the track
 * @param segments - Array of segments in a track
 * @returns duration of a track
 *
 * @alpha
 */
export function getDuration(
	manifest: HlsManifest,
	segments: SegmentHls[],
): number | null {
	if (!manifest?.targetDuration) {
		console.error('Could not calculate duration, manifest is undefined.')
		return null
	}
	return manifest?.targetDuration * segments.length
}
