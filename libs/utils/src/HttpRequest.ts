import type { RequestResponseType } from './RequestResponseType.ts'

/**
 * Generic request API.
 *
 * @public
 */
export type HttpRequest<D = any> = {

	/**
	 * The URL of the request.
	 */
	url: string;

	/**
	 * The request's method (GET, POST, etc).
	 */
	method?: string;

	/**
	 * The body of the request.
	 */
	body?: BodyInit;

	/**
	 * The type that the response from the server must be compatible with.
	 */
	responseType?: RequestResponseType;

	/**
	 * The headers object associated with the request.
	 */
	headers?: Record<string, string>;

	/**
	 * Whether the user agent should send or receive cookies from the other domain in cross-origin requests.
	 */
	credentials?: RequestCredentials;

	/**
	 * The mode of the request, for example cors, no-cors, or same-origin.
	 */
	mode?: RequestMode;

	/**
	 * The number of milliseconds the request may take before it is terminated.
	 * If the value is undefined or 0, there is no timeout.
	 */
	timeout?: number;

	/**
	 * Any custom data.
	 */
	customData?: D;
};
