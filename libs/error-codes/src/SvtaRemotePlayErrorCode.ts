import type { ValueOf } from '@svta/cml-utils'

/**
 * SVTA 6 [Remote Play] 000: Unknown remote play error
 *
 * @public
 */
export const SVTA_REMOTE_PLAY_UNKNOWN = 6000 as const

/**
 * SVTA 6 [Remote Play] 001: Sender unable to initialize remote play
 *
 * @public
 */
export const SVTA_SENDER_INITIALIZATION_ERROR = 6001 as const

/**
 * SVTA 6 [Remote Play] 002: Sender unable to make a connection to the receiver
 *
 * @public
 */
export const SVTA_SENDER_CONNECTION_ERROR = 6002 as const

/**
 * SVTA 6 [Remote Play] 003: Receiver does not exist or is unavailable
 *
 * @public
 */
export const SVTA_RECEIVER_UNAVAILABLE = 6003 as const

/**
 * SVTA 6 [Remote Play] 004: Receiver refused remote play connection
 *
 * @public
 */
export const SVTA_RECEIVER_CONNECTION_REFUSED = 6004 as const

/**
 * SVTA 6 [Remote Play] 005: Connection to the receiver lost
 *
 * @public
 */
export const SVTA_RECEIVER_CONNECTION_LOST = 6005 as const

/**
 * SVTA 6 [Remote Play] 006: Connection to the sender lost
 *
 * @public
 */
export const SVTA_SENDER_CONNECTION_LOST = 6006 as const

/**
 * SVTA 6 [Remote Play] 007: Receiver is not supported to playback this stream
 *
 * @public
 */
export const SVTA_RECEIVER_UNSUPPORTED_STREAM = 6007 as const

/**
 * SVTA 6 [Remote Play] 008: Receiver is already in remote play
 *
 * @public
 */
export const SVTA_RECEIVER_ALREADY_IN_REMOTE_PLAY = 6008 as const

/**
 * SVTA 6 [Remote Play] 009: Receiver terminated playback because of an error
 *
 * @public
 */
export const SVTA_RECEIVER_PLAYBACK_ERROR = 6009 as const

/**
 * SVTA standardized error codes in the Remote Play category (6xxx): the
 * framework supporting play out of the stream on a second device.
 *
 * @see {@link https://www.svta.org/product/svta2070/ | SVTA2070: Standardized Error Codes}
 *
 * @enum
 *
 * @public
 */
export const SvtaRemotePlayErrorCode = {
	/**
	 * Unknown remote play error
	 */
	UNKNOWN: SVTA_REMOTE_PLAY_UNKNOWN as typeof SVTA_REMOTE_PLAY_UNKNOWN,

	/**
	 * Sender unable to initialize remote play
	 */
	SENDER_INITIALIZATION_ERROR: SVTA_SENDER_INITIALIZATION_ERROR as typeof SVTA_SENDER_INITIALIZATION_ERROR,

	/**
	 * Sender unable to make a connection to the receiver
	 */
	SENDER_CONNECTION_ERROR: SVTA_SENDER_CONNECTION_ERROR as typeof SVTA_SENDER_CONNECTION_ERROR,

	/**
	 * Receiver does not exist or is unavailable
	 */
	RECEIVER_UNAVAILABLE: SVTA_RECEIVER_UNAVAILABLE as typeof SVTA_RECEIVER_UNAVAILABLE,

	/**
	 * Receiver refused remote play connection
	 */
	RECEIVER_CONNECTION_REFUSED: SVTA_RECEIVER_CONNECTION_REFUSED as typeof SVTA_RECEIVER_CONNECTION_REFUSED,

	/**
	 * Connection to the receiver lost
	 */
	RECEIVER_CONNECTION_LOST: SVTA_RECEIVER_CONNECTION_LOST as typeof SVTA_RECEIVER_CONNECTION_LOST,

	/**
	 * Connection to the sender lost
	 */
	SENDER_CONNECTION_LOST: SVTA_SENDER_CONNECTION_LOST as typeof SVTA_SENDER_CONNECTION_LOST,

	/**
	 * Receiver is not supported to playback this stream
	 */
	RECEIVER_UNSUPPORTED_STREAM: SVTA_RECEIVER_UNSUPPORTED_STREAM as typeof SVTA_RECEIVER_UNSUPPORTED_STREAM,

	/**
	 * Receiver is already in remote play
	 */
	RECEIVER_ALREADY_IN_REMOTE_PLAY: SVTA_RECEIVER_ALREADY_IN_REMOTE_PLAY as typeof SVTA_RECEIVER_ALREADY_IN_REMOTE_PLAY,

	/**
	 * Receiver terminated playback because of an error
	 */
	RECEIVER_PLAYBACK_ERROR: SVTA_RECEIVER_PLAYBACK_ERROR as typeof SVTA_RECEIVER_PLAYBACK_ERROR,
} as const

/**
 * Union type of all {@link (SvtaRemotePlayErrorCode:variable)} values.
 *
 * @public
 */
export type SvtaRemotePlayErrorCode = ValueOf<typeof SvtaRemotePlayErrorCode>
