import { Segment } from '../../types/model/index.js';
import { Byterange, HlsManifest, SegmentHls } from '../../types';

/**
 * Get byterange from HLS Manifest
 *
 * @param byteRange
 */
function getByterange(byteRange: Byterange | undefined): string | undefined {
	if (!byteRange) {
		return undefined;
	}
	return `${byteRange.length}@${byteRange.offset}`;
}

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
