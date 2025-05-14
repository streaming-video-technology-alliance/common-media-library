
import type { AudioTrack } from '../../../types/model/AudioTrack';
import type { Segment } from '../../../types/model/Segment';
import type { Track } from '../../../types/model/Track';

import type { SegmentBase } from '../../../types/mapper/dash/SegmentBase';

export function trackToSegmentBase(track: Track): SegmentBase[] {
	const segments: SegmentBase[] = [];
	if (
		track.segments.length > 0 &&
		track.byteRange &&
		track.segments[0].byteRange &&
		track.segments[0].byteRange.includes('@')
	) {
		let firstSegment: SegmentBase | undefined = undefined;
		const initByteRange = track.byteRange.includes('-')
			? track.byteRange.split('-')[1]
			: track.byteRange.includes('@')
				? track.byteRange.split('@')[0]
				: '';
		const initRange: number = +initByteRange - 1;
		const byteFirstSegment = track.segments[0].byteRange.includes('-')
			? track.segments[0].byteRange.split('-')[1]
			: track.segments[0].byteRange.includes('@')
				? track.segments[0].byteRange.split('@')[1]
				: '';
		const numberFirstByteRange: number = +byteFirstSegment - 1;
		firstSegment = {
			$: {
				indexRange: `${initByteRange}-${numberFirstByteRange}`,
			},
			Initialization: [{ $: { range: `0-${initRange}` } }],
		} as SegmentBase;
		if (firstSegment && track.type === 'audio') {
			// All segments should have timescale, but for now, just the audio ones store this value
			const audioTrack = track as AudioTrack;
			firstSegment.$.timescale = audioTrack.sampleRate.toString() ?? '';
		}
		if (firstSegment) {
			segments.push(firstSegment);
		}
	}
	else {
		track.segments.forEach((segment: Segment) => {
			let newSegment: SegmentBase | undefined;
			if (segment.byteRange) {
				const initRange: number = +segment.byteRange.split('-')[0] - 1;
				newSegment = {
					$: {
						indexRange: segment.byteRange,
					},
					Initialization: [{ $: { range: `0-${initRange}` } }],
				} as SegmentBase;
			}
			if (newSegment && track.type === 'audio') {
				// All segments should have timescale, but for now, just the audio ones store this value
				const audioTrack = track as AudioTrack;
				newSegment.$.timescale = audioTrack.sampleRate.toString() ?? '';
			}
			if (newSegment) {
				segments.push(newSegment);
			}
		});
	}

	return segments;
}
