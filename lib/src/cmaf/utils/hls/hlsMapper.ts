import { Segment } from '../../ham/model/Segment.js';

function formatSegmentUrl(url: string, segmentUrl: string) {
	return url.split('/').slice(0, -1).join('/') + '/' + segmentUrl;
}

async function readHLS(manifestUrl: string): Promise<string> {
	const response = await fetch(manifestUrl, {
		headers: {
			'Content-Type': 'application/vnd.apple.mpegurl',
		},
	});
	return response.text();
}

async function formatSegments(segments: any[]) {
	const formattedSegments: Segment[] = [];
	await Promise.all(
		segments.map(async (segment: any) => {
			const { duration, uri } = segment;
			const { length, offset } = segment.byterange;
			formattedSegments.push(
				new Segment(duration, uri, `${length}@${offset}`),
			);
		}),
	);

	return formattedSegments;
}

export { readHLS, formatSegmentUrl, formatSegments };
