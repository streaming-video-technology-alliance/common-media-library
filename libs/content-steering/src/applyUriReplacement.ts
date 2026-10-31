import { replaceQueryParams } from './replaceQueryParams.ts'
import { toHostname } from './toHostname.ts'
import type { UriReplacement } from './UriReplacement.ts'

/**
 * Options for `applyUriReplacement`.
 *
 *
 * @beta
 */
export type UriReplacementOptions = {
	/**
	 * The absolute URI that a relative `uri` resolves against.
	 */
	baseUri?: string;

	/**
	 * HLS only. The STABLE-VARIANT-ID of the variant stream of `uri`.
	 */
	stableVariantId?: string;

	/**
	 * HLS only. The STABLE-RENDITION-ID of the rendition of `uri`.
	 */
	stableRenditionId?: string;
};

/**
 * Builds a URI of a pathway clone from a URI of its base pathway.
 * If the replacement has no `HOST` and no `PARAMS` entries, the function returns `uri` unchanged.
 *
 * @param uri - A URI of the base pathway.
 * @param replacement - The `URI-REPLACEMENT` object of the pathway clone.
 * @param options - The base URI and the HLS stable IDs.
 * @returns The absolute URI of the pathway clone, or `uri` unchanged.
 *
 * @throws TypeError when `HOST` is not a hostname without a port.
 * @throws TypeError when `uri` is relative, `baseUri` is absent, and `HOST` or a `PARAMS` entry applies.
 *
 * @example
 * {@includeCode ../test/applyUriReplacement.test.ts#example}
 *
 * @see {@link https://datatracker.ietf.org/doc/html/draft-pantos-content-steering-05#section-5 | Pathway Cloning}
 * @see {@link https://datatracker.ietf.org/doc/html/draft-pantos-hls-rfc8216bis-22#section-7.3 | HLS Pathway Cloning}
 *
 * @beta
 */
export function applyUriReplacement(uri: string, replacement: UriReplacement, options?: UriReplacementOptions): string {
	const override = findUri(replacement['PER-VARIANT-URIS'], options?.stableVariantId)
		?? findUri(replacement['PER-RENDITION-URIS'], options?.stableRenditionId)

	if (override !== undefined) {
		return override
	}

	const { HOST, PARAMS } = replacement

	if (HOST === undefined && (!PARAMS || Object.keys(PARAMS).length === 0)) {
		return uri
	}

	const url = toUrl(uri, options?.baseUri)

	if (HOST !== undefined) {
		const hostname = toHostname(HOST)

		if (hostname === undefined) {
			throw new TypeError(`applyUriReplacement: HOST must be a hostname without a port. Received '${HOST}'.`)
		}

		url.hostname = hostname
	}

	if (PARAMS) {
		url.search = replaceQueryParams(url.search, PARAMS)
	}

	return url.href
}

function findUri(uris: unknown, id: string | undefined): string | undefined {
	if (typeof uris !== 'object' || uris === null || Array.isArray(uris) || id === undefined) {
		return undefined
	}

	const uri: unknown = (uris as Record<string, unknown>)[id]

	return typeof uri === 'string' && isAbsoluteUri(uri) ? uri : undefined
}

function isAbsoluteUri(uri: string): boolean {
	try {
		new URL(uri)
		return true
	} catch {
		return false
	}
}

function toUrl(uri: string, baseUri: string | undefined): URL {
	try {
		return new URL(uri, baseUri)
	} catch {
		throw new TypeError(`applyUriReplacement: uri must be absolute, or baseUri must be an absolute URI. Received uri '${uri}' and baseUri '${baseUri}'.`)
	}
}
