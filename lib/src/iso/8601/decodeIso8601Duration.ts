const DURATION = /^([-])?P(?:([\d.]*)Y)?(?:([\d.]*)M)?(?:([\d.]*)D)?T?(?:([\d.]*)H)?(?:([\d.]*)M)?(?:([\d.]*)S)?$/;

const SECONDS_IN_YEAR = 365 * 24 * 60 * 60;
const SECONDS_IN_MONTH = 30 * 24 * 60 * 60;
const SECONDS_IN_DAY = 24 * 60 * 60;
const SECONDS_IN_HOUR = 60 * 60;
const SECONDS_IN_MIN = 60;

/**
 * Decode an ISO 8601 duration string into seconds.
 *
 * @param isoDuration - ISO 8601 duration string.
 * @returns Duration in seconds.
 *
 * @group ISO 8601
 * @beta
 *
 * @example
 * ```ts
 * const result = decodeIso8601Duration('PT1H1M1S');
 * console.log(result);
 * // -> 3661
 * ```
 */
export function decodeIso8601Duration(isoDuration: string): number {
	const match = DURATION.exec(isoDuration);

	if (!match) {
		return NaN;
	}

	const duration =
		Number(match[2] || 0) * SECONDS_IN_YEAR +
		Number(match[3] || 0) * SECONDS_IN_MONTH +
		Number(match[4] || 0) * SECONDS_IN_DAY +
		Number(match[5] || 0) * SECONDS_IN_HOUR +
		Number(match[6] || 0) * SECONDS_IN_MIN +
		Number(match[7] || 0);

	if (!isFinite(duration)) {
		return NaN;
	}

	return match[1] === undefined ? duration : -duration;
}
