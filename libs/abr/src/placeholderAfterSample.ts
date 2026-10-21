// Derived from dash.js BolaRule.js, Copyright (c) 2016, Dash Industry Forum, BSD-3-Clause. See NOTICE.md.

import { PLACEHOLDER_DECAY } from './BOLA_CONSTANTS.ts'
import type { BolaParams } from './BolaParams.ts'
import { findRung } from './findRung.ts'
import { isPositiveFinite } from './isPositiveFinite.ts'
import { MILLISECONDS_PER_SECOND } from './MILLISECONDS_PER_SECOND.ts'
import type { SegmentSample } from './SegmentSample.ts'

/**
 * Returns the placeholder buffer after a finished download.
 *
 * The placeholder decays by `PLACEHOLDER_DECAY`. It also has a cap.
 * The cap keeps the effective buffer at the request start within the maximum buffer of the sampled rung.
 * A replacement segment did not grow the buffer, so the placeholder grows by its media duration.
 *
 * @param params - The values that BOLA derived from the ladder
 * @param placeholder - The placeholder buffer before the sample, in seconds
 * @param segment - The finished segment
 * @param bufferLevel - The real buffer level when the download finished, in seconds. The value is 0 or more.
 * @returns The placeholder buffer after the sample, in seconds
 */
export function placeholderAfterSample(params: BolaParams, placeholder: number, segment: SegmentSample, bufferLevel: number): number {
	const requestSeconds = Number.isFinite(segment.timing.duration) ? segment.timing.duration / MILLISECONDS_PER_SECOND : 0
	const bufferAtRequestStart = bufferLevel + requestSeconds
	const maximumBuffer = params.maximumBuffers[findRung(params.rungs, segment.bandwidth)]
	const decayed = Math.min(placeholder * PLACEHOLDER_DECAY, Math.max(0, maximumBuffer - bufferAtRequestStart))

	return segment.isReplacement && isPositiveFinite(segment.duration) ? decayed + segment.duration : decayed
}
