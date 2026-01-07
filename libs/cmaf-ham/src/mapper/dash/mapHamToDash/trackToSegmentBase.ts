
import type { AudioTrack } from '../../../types/model/AudioTrack.ts'
import type { Segment } from '../../../types/model/Segment.ts'
import type { Track } from '../../../types/model/Track.ts'

import type { SegmentBase } from '../../../types/mapper/dash/SegmentBase.ts'
import { byteRangeToDashString } from '../../../utils/byteRange.ts'

export function trackToSegmentBase(track: Track): SegmentBase[] {
	const segments: SegmentBase[] = []
	if (
		track.segments.length > 0 &&
		track.initialization.byteRange &&
		track.segments[0].byteRange
	) {
		let firstSegment: SegmentBase | undefined = undefined
		// Use the new byteRange object format from initialization
		const initByteRange = track.initialization.byteRange
		const initRange: number = initByteRange.end

		// Use the new byteRange object format from segment
		const segmentByteRange = track.segments[0].byteRange
		const numberFirstByteRange: number = segmentByteRange.start - 1

		firstSegment = {
			$: {
				indexRange: `${initByteRange.end}-${numberFirstByteRange}`,
			},
			Initialization: [{ $: { range: `0-${initRange}` } }],
		} as SegmentBase
		if (firstSegment && track.type === 'audio') {
			// All segments should have timescale, but for now, just the audio ones store this value
			const audioTrack = track as AudioTrack
			firstSegment.$.timescale = audioTrack.sampleRate.toString() ?? ''
		}
		if (firstSegment) {
			segments.push(firstSegment)
		}
	}
	else {
		track.segments.forEach((segment: Segment) => {
			let newSegment: SegmentBase | undefined
			if (segment.byteRange) {
				const initRange: number = segment.byteRange.start - 1
				const indexRange = byteRangeToDashString(segment.byteRange)
				newSegment = {
					$: {
						indexRange,
					},
					Initialization: [{ $: { range: `0-${initRange}` } }],
				} as SegmentBase
			}
			if (newSegment && track.type === 'audio') {
				// All segments should have timescale, but for now, just the audio ones store this value
				const audioTrack = track as AudioTrack
				newSegment.$.timescale = audioTrack.sampleRate.toString() ?? ''
			}
			if (newSegment) {
				segments.push(newSegment)
			}
		})
	}

	return segments
}
