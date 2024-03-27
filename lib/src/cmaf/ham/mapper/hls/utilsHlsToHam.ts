import { Segment } from '../../types/model';
import { Byterange, HlsManifest, SegmentHls } from '../../types';

/**
 * @internal
 *
 * Get byterange from HLS Manifest
 *
 * @param byteRange - Byterange object containning length and offset
 * @returns string containing the byterange. If byterange is undefined, it returns undefined.
 *
 * @group CMAF
 * @alpha
 */
function getByterange(byteRange: Byterange | undefined): string | undefined {
	if (!byteRange) {
		return undefined;
	}
	return `${byteRange.length}@${byteRange.offset}`;
}

/**
 * @internal
 *
 * Get the codec for a type of content.
 *
 * @param type - Type of the content to get the codecs for
 * @param codecs - String containing multiple codecs separated with commas.
 * @returns string containing codec
 *
 * @group CMAF
 * @alpha
 */
function getCodec(type: string, codecs?: string): string {
	if (type === 'audio') {
		// Using codec mp4a.40.2 for now, we should retrieve it by finding
		// the video playlist that is related to this audio group.
		return 'mp4a.40.2';
	} else if (type === 'video') {
		// CODECS could be a comma separated value
		// where it has video and audio codec. Using
		// position zero for now.
		// TODO: Get the correct video codec.
		return codecs?.split(',').at(0) ?? '';
	} else {
		// if (type === 'text')
		return '';
	}
}

/**
 * @internal
 *
 * Calculate the duration of a track
 *
 * `target duration * number of segments`
 *
 * @param manifest - Manifest of the track
 * @param segments - Array of segments in a track
 * @returns duration of a track
 *
 * @group CMAF
 * @alpha
 */
function getDuration(
	manifest: HlsManifest,
	segments: SegmentHls[],
): number | null {
	if (!manifest?.targetDuration) {
		console.error('Could not calculate duration, manifest is undefined.');
		return null;
	}
	return manifest?.targetDuration * segments.length;
}

/**
 * @internal
 *
 * Format the hls segments into the ham segments.
 *
 * @param segments - Array of segments
 * @returns ham formatted array of segments
 *
 * @group CMAF
 * @alpha
 */
function formatSegments(segments: SegmentHls[]): Segment[] {
	return (
		segments?.map((segment: any) => {
			return {
				duration: segment.duration,
				url: segment.uri,
				byteRange: getByterange(segment?.byterange),
			} as Segment;
		}) ?? []
	);
}

export { getByterange, getCodec, getDuration, formatSegments };
