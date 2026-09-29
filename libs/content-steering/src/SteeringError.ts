import type { STEERING_ERROR_TYPE_CALLBACK, STEERING_ERROR_TYPE_LOAD, STEERING_ERROR_TYPE_PARSE } from './SteeringErrorType.ts'

/**
 * An error that the engine reports to `onError`.
 *
 * `SteeringErrorType` lists the values of `type`.
 *
 *
 * @beta
 */
export type SteeringError =
	| {
		/**
		 * `load` when the request fails, and `parse` when the Steering Manifest is not valid.
		 */
		readonly type: typeof STEERING_ERROR_TYPE_LOAD | typeof STEERING_ERROR_TYPE_PARSE;

		/**
		 * The request URI.
		 */
		readonly url: string;

		/**
		 * The HTTP status, if the server responded.
		 */
		readonly status?: number;

		/**
		 * The exception, for network errors and JSON errors.
		 */
		readonly cause?: unknown;

		/**
		 * A description of the error.
		 */
		readonly message: string;

		/**
		 * The milliseconds until the next request. Absent when no request follows.
		 */
		readonly retryDelay?: number;
	}
	| {
		/**
		 * An exception from a callback of the player.
		 */
		readonly type: typeof STEERING_ERROR_TYPE_CALLBACK;

		/**
		 * The callback that threw.
		 */
		readonly callback: 'acceptClone' | 'getReportedPathways' | 'getThroughput' | 'onManifest' | 'onPathwayChange';

		/**
		 * The exception.
		 */
		readonly cause: unknown;

		/**
		 * A description of the error.
		 */
		readonly message: string;
	};
