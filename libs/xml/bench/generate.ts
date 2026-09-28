/**
 * Options for the synthetic DASH manifest generator.
 */
export type GenerateMpdOptions = {
	/** Number of `<Period>` elements (default 50) */
	periods?: number;
	/** Number of `<AdaptationSet>` elements per Period, alternating video and audio (default 4) */
	adaptationSets?: number;
	/** Number of `<S>` elements per SegmentTimeline (default 500) */
	segments?: number;
	/** Two-space indentation and line breaks (default true); false yields a single line */
	pretty?: boolean;
	/** Emit `<S ...></S>` as livesim2 does instead of `<S ... />` (default false) */
	closed?: boolean;
};

/**
 * Generates a synthetic live DASH manifest in the shape reported in issue #424: `periods` Periods,
 * each with `adaptationSets` AdaptationSets whose SegmentTimeline carries `segments` `<S>` elements.
 * The `<S>` forms cycle through `t d`, `d r`, `d r k`, and `d`. The result is a flat string, as a
 * manifest decoded from a network response would be.
 */
export function generateMpd(options: GenerateMpdOptions = {}): string {
	const { periods = 50, adaptationSets = 4, segments = 500, pretty = true, closed = false } = options
	const nl = pretty ? '\n' : ''
	const indent = (depth: number): string => (pretty ? '  '.repeat(depth) : '')
	const segmentEnd = (closed ? '></S>' : ' />') + nl
	const parts: string[] = [
		'<?xml version="1.0" encoding="UTF-8"?>' + nl,
		'<MPD xmlns="urn:mpeg:dash:schema:mpd:2011" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" profiles="urn:mpeg:dash:profile:isoff-live:2011" type="dynamic" availabilityStartTime="1970-01-01T00:00:00Z" publishTime="2026-09-02T14:45:04Z" minimumUpdatePeriod="PT2S" minBufferTime="PT2S" timeShiftBufferDepth="PT6H" maxSegmentDuration="PT2S">' + nl,
	]
	let t = 0

	for (let p = 0; p < periods; p++) {
		parts.push(indent(1) + `<Period id="p${p}" start="PT${p * segments * 2}S">` + nl)

		for (let a = 0; a < adaptationSets; a++) {
			const video = a % 2 === 0
			parts.push(indent(2) + (video
				? `<AdaptationSet id="${a}" contentType="video" mimeType="video/mp4" segmentAlignment="true" startWithSAP="1" maxWidth="1280" maxHeight="720" par="16:9">`
				: `<AdaptationSet id="${a}" contentType="audio" mimeType="audio/mp4" lang="en" segmentAlignment="true">`) + nl)
			parts.push(indent(3) + (video
				? `<Representation id="v${a}" bandwidth="1500000" codecs="avc1.64001f" width="1280" height="720" frameRate="30" sar="1:1" />`
				: `<Representation id="a${a}" bandwidth="96000" codecs="mp4a.40.2" audioSamplingRate="48000" />`) + nl)
			parts.push(indent(3) + '<SegmentTemplate timescale="90000" media="$RepresentationID$/$Time$.m4s" initialization="$RepresentationID$/init.mp4">' + nl)
			parts.push(indent(4) + '<SegmentTimeline>' + nl)

			for (let s = 0; s < segments; s++) {
				const form = s % 4
				let tag: string
				if (form === 0) {
					tag = `<S t="${t}" d="180000"`
				}
				else if (form === 1) {
					tag = '<S d="180000" r="14"'
				}
				else if (form === 2) {
					tag = '<S d="180000" r="-1" k="3"'
				}
				else {
					tag = '<S d="180000"'
				}
				parts.push(indent(5) + tag + segmentEnd)
				t += 180000
			}

			parts.push(indent(4) + '</SegmentTimeline>' + nl + indent(3) + '</SegmentTemplate>' + nl + indent(2) + '</AdaptationSet>' + nl)
		}

		parts.push(indent(1) + '</Period>' + nl)
	}

	parts.push('</MPD>' + nl)

	return parts.join('')
}
