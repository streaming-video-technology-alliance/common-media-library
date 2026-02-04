import type { Request } from './Request.ts'

/**
 * Generic response API.
 *
 * @public
 */
export type Response<R extends Request = Request, D = unknown> = {

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
	data?: D;
};
