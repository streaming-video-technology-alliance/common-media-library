import type { Track } from '../../../types/model/Track.js';

import type { SegmentList } from '../../../types/mapper/dash/SegmentList.js';
import type { SegmentURL } from '../../../types/mapper/dash/SegmentUrl.js';

import { getTimescale } from './utils/getTimescale.js';

export function trackToSegmentList(track: Track): SegmentList[] {
	const segmentList: SegmentList[] = [];
	const segmentURLs: SegmentURL[] = [];
	track.segments.forEach((segment) => {
		segmentURLs.push({
			$: {
				media: segment.url,
			},
		});
	});

	if (!track.segments.at(0)?.byteRange) {
		const timescale = getTimescale(track);
		segmentList.push({
			$: {
				duration: (
					(track.duration * timescale) /
					segmentURLs.length
				).toString(),
				timescale: timescale.toString(),
			},
			Initialization: [{ $: { sourceURL: track.urlInitialization } }],
			SegmentURL: segmentURLs,
		} as SegmentList);
	}
	return segmentList;
}
