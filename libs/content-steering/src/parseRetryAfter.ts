const DELAY_SECONDS = /^\d+$/
const HTTP_DATE = /GMT$/

/**
 * Converts a `Retry-After` header value to a delay.
 *
 * @param value - The header value: a number of seconds or an HTTP date.
 * @param now - The current time, in milliseconds since the epoch.
 * @returns The delay in milliseconds, or `undefined` when the value is not valid.
 *
 * @internal
 */
export function parseRetryAfter(value: string | undefined, now: number): number | undefined {
	const text = value?.trim()

	if (!text) {
		return undefined
	}

	if (DELAY_SECONDS.test(text)) {
		return Number(text) * 1000
	}

	const time = HTTP_DATE.test(text) ? Date.parse(text) : NaN

	return Number.isNaN(time) ? undefined : Math.max(0, time - now)
}
