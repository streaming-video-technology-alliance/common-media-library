const DELAY_SECONDS = /^\d+$/
const HTTP_DATE = /GMT$/

/**
 * Converts a `Retry-After` header value to a delay.
 *
 * @param value - The header value: a number of seconds or an HTTP date.
 * @param now - The current time, in milliseconds since the epoch.
 * @returns The delay in milliseconds, or `undefined` when the value is not
 * valid or the delay is not positive.
 *
 * @internal
 */
export function parseRetryAfter(value: string | undefined, now: number): number | undefined {
	const text = value?.trim()

	if (!text) {
		return undefined
	}

	if (DELAY_SECONDS.test(text)) {
		const delay = Number(text) * 1000
		return Number.isFinite(delay) && delay > 0 ? delay : undefined
	}

	const time = HTTP_DATE.test(text) ? Date.parse(text) : NaN

	if (Number.isNaN(time)) {
		return undefined
	}

	const delay = time - now
	return delay > 0 ? delay : undefined
}
