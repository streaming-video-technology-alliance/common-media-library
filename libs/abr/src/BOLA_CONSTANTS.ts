// Derived from dash.js BolaRule.js, Copyright (c) 2016, Dash Industry Forum, BSD-3-Clause. See NOTICE.md.

/**
 * The buffer level, in seconds, at which the score of the lowest rung reaches zero.
 * BOLA waits for a buffer above this level before it picks a higher rung.
 * dash.js uses 10 as `MINIMUM_BUFFER_S`.
 *
 * @internal
 */
export const MINIMUM_BUFFER = 10

/**
 * The seconds that each distinct rung adds to `MINIMUM_BUFFER` in the smallest buffer time of BOLA.
 * dash.js uses 2 as `MINIMUM_BUFFER_PER_BITRATE_LEVEL_S`.
 *
 * @internal
 */
export const MINIMUM_BUFFER_PER_RUNG = 2

/**
 * The factor that multiplies the placeholder buffer after each sample.
 * dash.js uses 0.99 as `PLACEHOLDER_BUFFER_DECAY`.
 *
 * @internal
 */
export const PLACEHOLDER_DECAY = 0.99

/**
 * The buffer level, in seconds, at or below which a selector in the steady state treats playback as stalled.
 * dash.js uses 0.3 as the default `stallThreshold` of its `BufferController`.
 *
 * @internal
 */
export const STALL_THRESHOLD = 0.3

/**
 * The number of finished samples, since the last reset, that the starvation guard waits for.
 * dash.js uses 2 as the default `segmentIgnoreCount` of its insufficient buffer rule.
 *
 * @internal
 */
export const STARVATION_GUARD_SAMPLE_COUNT = 2

/**
 * The seconds below a threshold at which the effective buffer still counts as at the threshold.
 * The effective buffer is a sum of two numbers. A value that equals a threshold in exact arithmetic can fall one rounding error below it.
 * An abort cap sets the effective buffer to a threshold on purpose. Without this margin, the pick would depend on that rounding error.
 * The margin is far above the rounding error and far below the buffer level that a player can measure.
 * dash.js has no such margin.
 *
 * @internal
 */
export const THRESHOLD_TOLERANCE = 1e-9

/**
 * The delay, in seconds, at or below which a selector returns a delay of 0.
 * It is the resolution of a clock in milliseconds, so a player cannot wait for less.
 * It also absorbs the rounding error of the placeholder arithmetic.
 *
 * @internal
 */
export const NEGLIGIBLE_DELAY = 0.001
