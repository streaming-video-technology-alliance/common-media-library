import { Segment } from '../../types/model';
import { Byterange } from '../../types';

/**
 * Get byterange from HLS Manifest
 *
 * @param byteRange
 */
function getByterange(byteRange: Byterange | undefined): string {
	if (!byteRange) {
		return '';
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

function getDuration(parsed: any | undefined, segments: any[]): number {
	if (!parsed) {
		console.error('Could not calculate duration, object is undefined.');
		return 0;
	}
	return parsed?.targetDuration * segments.length;
}

function _formatSegments(segments: any[]): Segment[] {
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

export { getByterange, getCodec, getDuration, _formatSegments };
