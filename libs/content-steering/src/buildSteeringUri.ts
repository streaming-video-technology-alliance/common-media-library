import { replaceQueryParams } from './replaceQueryParams.ts'

const DATA_URI = /^data:/i
const PARTS = /^([^?#]*)\??([^#]*)(.*)$/s

/**
 * Sets the steering query parameters on a Steering Manifest URI.
 *
 * The function removes every query parameter whose name starts with
 * `prefix` and then sets `params`. The other parts of the URI do not
 * change. A `data` URI gets no parameters.
 *
 * @param uri - The absolute Steering Manifest URI.
 * @param prefix - The prefix of the steering query parameters.
 * @param params - The steering query parameters.
 * @returns The request URI.
 *
 * @internal
 */
export function buildSteeringUri(
	uri: string,
	prefix: string,
	params: Readonly<Record<string, string>>,
): string {
	if (DATA_URI.test(uri)) {
		return uri
	}

	return uri.replace(PARTS, (_, path: string, search: string, fragment: string) => {
		const kept = search.split('&').filter(part => !part.startsWith(prefix))
		const query = replaceQueryParams(kept.join('&'), params)

		return query ? `${path}?${query}${fragment}` : path + fragment
	})
}
