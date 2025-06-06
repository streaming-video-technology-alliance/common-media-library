import type { CommonMediaRequest } from './CommonMediaRequest.js';
import type { ResourceTiming } from './ResourceTiming.js';
import type { ResponseTypeMap } from './ResponseTypeMap.js';

/**
 * Common response API.
 *
 * @group Request
 *
 * @beta
 */

export type CommonMediaResponse<R extends CommonMediaRequest = CommonMediaRequest> = {
	/**
	 * The origin request.
	 */
	request: R;

	/**
	 * The final URL obtained after any redirects.
	 */
	url?: string;

	/**
	 * Indicates whether or not the request was redirected.
	 */
	redirected?: boolean;

	/**
	 * The HTTP status code of the response.
	 */
	status?: number;

	/**
	 * The status message corresponding to the HTTP status code.
	 */
	statusText?: string;

	/**
	 * The type of the response.
	 */
	type?: string;

	/**
	 * The response headers.
	 */
	headers?: Record<string, string>;

	/**
	 * The response data.
	 */
	data?: ResponseTypeMap<R['responseType']>;

	/**
	 * The network timing of the request/response.
	 */
	resourceTiming?: ResourceTiming;
};
