import type { CommonMediaRequest } from './CommonMediaRequest.js';
import type { ResourceTiming } from './ResourceTiming.js';

/**
 * Common response API.
 *
 * @group Request
 *
 * @beta
 */

export type CommonMediaResponse = {
	/**
	 * The origin request.
	 */
	request: CommonMediaRequest

	/**
	 * The final URL obtained after any redirects.
	 */
	url?: string

	/**
	 * Indicates whether or not the request was redirected.
	 */
	redirected?: boolean

	/**
	 * The HTTP status code of the response.
	 */
	status?: number

	/**
	 * The status message corresponding to the HTTP status code.
	 */
	statusText?: string

	/**
	 * The type of the response.
	 */
	type?: string

	/**
	 * The response headers.
	 */
	headers?: Record<string, string>

	/**
	 * The response data.
	 */
	data?: any

	/**
	 * The network timing of the request/response.
	 */
	resourceTiming: ResourceTiming
}
