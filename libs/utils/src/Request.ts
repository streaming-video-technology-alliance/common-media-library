import type { RequestType } from './RequestType.ts'

/**
 * Generic request API.
 *
 * @public
 */
export type Request<D = any> = {

	/**
	 * The URL of the request.
	 */
	url: string;

	/**
	 * The request's method (GET, POST, etc).
	 */
	method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';

	/**
	 * The body of the request.
	 */
	body?: BodyInit;

	/**
	 * The response type with which the response from the server shall be compatible.
	 */
	responseType?: RequestType;

	/**
	 * The headers object associated with the request.
	 */
	headers?: Record<string, string>;

	/**
	 * Indicates whether the user agent should send or receive cookies from the other domain in the case of cross-origin requests.
	 */
	credentials?: RequestCredentials;

	/**
	 * The mode of the request (e.g., cors, no-cors, same-origin, etc).
	 */
	mode?: RequestMode;

	/**
	 * The number of milliseconds the request can take before automatically being terminated.
	 * If undefined or value is 0 then there is no timeout.
	 */
	timeout?: number;

	/**
	 * Any custom data.
	 */
	customData?: D;
};
