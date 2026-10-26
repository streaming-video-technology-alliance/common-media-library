import type { HlsManifest } from '../../../../types/mapper/hls/HlsManifest.ts'
import type { SegmentHls } from '../../../../types/mapper/hls/SegmentHls.ts'

/**
 * Calculate the duration of a track.
 *
 * `target duration * number of segments`
 *
 * @param manifest - Manifest of the track
 * @param segments - Array of segments in a track
 * @returns duration of a track. In case the manifest has no `targetDuration`, returns `null`.
 *
 * @alpha
 */
export function getDuration(manifest: HlsManifest, segments: SegmentHls[]): number | null {
	if (!manifest?.targetDuration) {
		return null
	}
	return manifest.targetDuration * segments.length
}
