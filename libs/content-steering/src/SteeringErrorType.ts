import type { ValueOf } from '@svta/cml-utils'

/**
 * A Steering Manifest request failed. The error has the SVTA2070 code 2040.
 *
 *
 * @public
 */
export const STEERING_ERROR_TYPE_LOAD = 'load' as const

/**
 * A Steering Manifest is not valid. The error has the SVTA2070 code 2041.
 *
 *
 * @public
 */
export const STEERING_ERROR_TYPE_PARSE = 'parse' as const

/**
 * A callback of the player threw, and no caller can receive the exception.
 *
 *
 * @public
 */
export const STEERING_ERROR_TYPE_CALLBACK = 'callback' as const

/**
 * The types of `SteeringError`.
 *
 * @enum
 *
 * @public
 */
export const SteeringErrorType = {
	/**
	 * A Steering Manifest request failed.
	 */
	LOAD: STEERING_ERROR_TYPE_LOAD as typeof STEERING_ERROR_TYPE_LOAD,

	/**
	 * A Steering Manifest is not valid.
	 */
	PARSE: STEERING_ERROR_TYPE_PARSE as typeof STEERING_ERROR_TYPE_PARSE,

	/**
	 * A callback of the player threw.
	 */
	CALLBACK: STEERING_ERROR_TYPE_CALLBACK as typeof STEERING_ERROR_TYPE_CALLBACK,
} as const

/**
 * @public
 */
export type SteeringErrorType = ValueOf<typeof SteeringErrorType>
