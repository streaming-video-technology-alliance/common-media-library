import { SfItem } from '@svta/cml-structured-field-values'
import { urlToRelativePath, type ValueOrArray } from '@svta/cml-utils'
import type { CmcdFormatter } from './CmcdFormatter.ts'
import type { CmcdFormatterOptions } from './CmcdFormatterOptions.ts'
import type { CmcdValue } from './CmcdValue.ts'

const roundValue = (value: CmcdValue): number | SfItem<number> => {
	if (value instanceof SfItem) {
		return new SfItem(Math.round(value.value as number), value.params)
	}
	return Math.round(value as number)
}

const toRounded = (value: CmcdValue) => {
	if (Array.isArray(value)) {
		return value.map(roundValue)
	}
	return roundValue(value)
}

const toUrlSafe = (value: CmcdValue, options: CmcdFormatterOptions): ValueOrArray<string | SfItem<string>> => {
	if (Array.isArray(value)) {
		return value.map(item => toUrlSafe(item, options) as string)
	}

	if (value instanceof SfItem && typeof value.value === 'string') {
		return new SfItem(toUrlSafe(value.value, options), value.params)
	}
	else {
		if (options.baseUrl) {
			value = urlToRelativePath(value as string, options.baseUrl)
		}
		return options.version === 1 ? encodeURIComponent(value as string) : (value as string)
	}
}

const hundredValue = (value: CmcdValue): number | SfItem<number> => {
	if (value instanceof SfItem) {
		return new SfItem(Math.round((value.value as number) / 100) * 100, value.params)
	}
	return Math.round((value as number) / 100) * 100
}

const toHundred = (value: CmcdValue) => {
	if (Array.isArray(value)) {
		return value.map(hundredValue)
	}
	return hundredValue(value)
}

const nor = (value: CmcdValue, options: CmcdFormatterOptions) => {
	let norValue = value

	if (options.version >= 2) {
		if (value instanceof SfItem && typeof value.value === 'string') {
			norValue = new SfItem([value])
		}
		else if (typeof value === 'string') {
			norValue = [value]
		}
	}

	return toUrlSafe(norValue, options)
}

/**
 * The default formatters for CMCD values.
 *
 * @public
 */
export const CMCD_FORMATTER_MAP: Record<string, CmcdFormatter> = {
	/**
	 * Bitrate (kbps) rounded integer
	 */
	br: toRounded,

	/**
	 * Duration (milliseconds) rounded integer
	 */
	d: toRounded,

	/**
	 * Buffer Length (milliseconds) rounded nearest 100ms
	 */
	bl: toHundred,

	/**
	 * Deadline (milliseconds) rounded nearest 100ms
	 */
	dl: toHundred,

	/**
	 * Measured Throughput (kbps) rounded nearest 100kbps
	 */
	mtp: toHundred,

	/**
	 * Next Object Request URL encoded
	 */
	nor,

	/**
	 * Requested maximum throughput (kbps) rounded nearest 100kbps
	 */
	rtp: toHundred,

	/**
	 * Top Bitrate (kbps) rounded integer
	 */
	tb: toRounded,
} as const
