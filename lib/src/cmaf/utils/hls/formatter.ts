import { Segment } from '../../ham/types/model/index.js';

function formatSegmentUrl(url: string, segmentUrl: string) {
	return url.split('/').slice(0, -1).join('/') + '/' + segmentUrl;
}

function formatSegments(segments: any[]) {
	const formattedSegments: Segment[] = [];
	segments.map(async (segment: any) => {
		const { duration, uri } = segment;
		const { length, offset } = segment.byterange
			? segment.byterange
			: { length: 0, offset: 0 };
		formattedSegments.push({
			duration: duration,
			url: uri,
			byteRange: `${length}@${offset}`,
		} as Segment);
	});

	return formattedSegments;
}

export { formatSegmentUrl, formatSegments };
