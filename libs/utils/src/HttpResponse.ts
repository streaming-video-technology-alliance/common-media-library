import type { HttpRequest } from './HttpRequest.ts'
import type { ResourceTiming } from './ResourceTiming.ts'
import type { ResponseTypeMap } from './ResponseTypeMap.ts'

/**
 * Generic response API.
 *
 * @public
 */
export type HttpResponse<R extends HttpRequest = HttpRequest> = {

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
	status: number;

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
