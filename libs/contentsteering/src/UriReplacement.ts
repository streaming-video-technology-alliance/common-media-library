/**
 * A URI replacement for content steering.
 *
 *
 * @beta
 */
export type UriReplacement = {
	/**
	 * A string that specifies the hostname for cloned URIs.
	 */
	HOST?: string;

	/**
	 * An object that specifies query parameters for cloned URIs.
	 * The keys represent query parameter names, and the values
	 * correspond to the associated parameter values.
	 */
	PARAMS?: Record<string, string>;
};
