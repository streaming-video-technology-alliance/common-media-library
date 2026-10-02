import { CMCD_PARAM } from './CMCD_PARAM.ts'
import { percentEncode } from './percentEncode.ts'

function isCmcdParam(param: string): boolean {
	return param === CMCD_PARAM || param.startsWith(`${CMCD_PARAM}=`)
}

/**
 * Replace the `CMCD` query parameter of a URL.
 *
 * The first `CMCD` parameter takes the new value in place. The function
 * removes the other `CMCD` parameters. If the URL has no `CMCD` parameter,
 * the new parameter goes at the end of the query. An empty `value` only
 * removes the parameters. The function does not change the rest of the URL.
 * The URL can be relative.
 *
 * @param url - The URL.
 * @param value - The encoded CMCD data, before percent-encoding.
 * @returns The URL with at most one `CMCD` parameter.
 *
 * @internal
 */
export function replaceCmcdParam(url: string, value?: string): string {
	const hashIndex = url.indexOf('#')
	const end = hashIndex === -1 ? url.length : hashIndex
	const queryIndex = url.indexOf('?')
	const start = queryIndex === -1 || queryIndex > end ? end : queryIndex
	const params: string[] = []
	let param = value ? `${CMCD_PARAM}=${percentEncode(value)}` : ''
	let found = false

	for (const item of start < end ? url.slice(start + 1, end).split('&') : []) {
		if (!isCmcdParam(item)) {
			params.push(item)
		}
		else {
			found = true

			if (param) {
				params.push(param)
				param = ''
			}
		}
	}

	if (param) {
		if (params[params.length - 1] === '') {
			params.pop()
		}

		params.push(param)
	}
	else if (!found) {
		return url
	}

	const query = params.join('&')

	return `${url.slice(0, start)}${query ? `?${query}` : ''}${url.slice(end)}`
}
