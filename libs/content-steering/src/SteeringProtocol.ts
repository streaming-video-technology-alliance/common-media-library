import type { ValueOf } from '@svta/cml-utils'

/**
 * The HLS protocol for content steering.
 *
 *
 * @public
 */
export const STEERING_PROTOCOL_HLS = 'hls' as const

/**
 * The DASH protocol for content steering.
 *
 *
 * @public
 */
export const STEERING_PROTOCOL_DASH = 'dash' as const

/**
 * The delivery protocols of content steering.
 *
 * @enum
 *
 * @public
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
 * @public
 */
export type SteeringProtocol = ValueOf<typeof SteeringProtocol>
