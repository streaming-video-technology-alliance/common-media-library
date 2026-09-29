import type { ValueOf } from '@svta/cml-utils'

/**
 * The HLS protocol for content steering.
 *
 *
 * @beta
 */
export const STEERING_PROTOCOL_HLS = 'hls' as const

/**
 * The DASH protocol for content steering.
 *
 *
 * @beta
 */
export const STEERING_PROTOCOL_DASH = 'dash' as const

/**
 * The delivery protocols of content steering.
 *
 * @enum
 *
 * @beta
 */
export const SteeringProtocol = {
	/**
	 * HTTP Live Streaming (HLS)
	 */
	HLS: STEERING_PROTOCOL_HLS as typeof STEERING_PROTOCOL_HLS,

	/**
	 * MPEG DASH
	 */
	DASH: STEERING_PROTOCOL_DASH as typeof STEERING_PROTOCOL_DASH,
} as const

/**
 * @beta
 */
export type SteeringProtocol = ValueOf<typeof SteeringProtocol>;
