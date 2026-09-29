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

	/**
	 * HLS only. An object that specifies replacement URIs for variant streams.
	 * The keys are STABLE-VARIANT-ID values, and the values are absolute URIs.
	 */
	'PER-VARIANT-URIS'?: Record<string, string>;

	/**
	 * HLS only. An object that specifies replacement URIs for renditions.
	 * The keys are STABLE-RENDITION-ID values, and the values are absolute URIs.
	 */
	'PER-RENDITION-URIS'?: Record<string, string>;
};
