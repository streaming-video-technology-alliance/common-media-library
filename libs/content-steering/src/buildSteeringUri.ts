import { replaceQueryParams } from './replaceQueryParams.ts'

/**
 * Sets the steering query parameters on a Steering Manifest URI.
 * A `data` URI gets no parameters.
 *
 * @param uri - The absolute Steering Manifest URI.
 * @param params - The steering query parameters.
 * @returns The request URI.
 *
 * @internal
 */
export function buildSteeringUri(uri: string, params: Readonly<Record<string, string>>): string {
	const url = new URL(uri)

	if (url.protocol === 'data:' || Object.keys(params).length === 0) {
		return uri
	}

	url.search = replaceQueryParams(url.search, params)

	return url.href
}
