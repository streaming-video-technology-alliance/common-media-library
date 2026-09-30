import { SfItem } from '@svta/cml-structured-field-values'
import { getBaseUrl, urlToRelativePath, type ValueOrArray } from '@svta/cml-utils'
import type { CmcdFormatter } from './CmcdFormatter.ts'
import type { CmcdFormatterOptions } from './CmcdFormatterOptions.ts'
import type { CmcdValue } from './CmcdValue.ts'

const formatNumbers = (value: CmcdValue, format: (value: number) => number): ValueOrArray<number | SfItem<number>> => {
	if (Array.isArray(value)) {
		return value.map(item => formatNumbers(item, format) as number)
	}

	if (value instanceof SfItem) {
		return new SfItem(formatNumbers(value.value as CmcdValue, format), value.params)
	}

	return format(value as number)
}

const toRounded = (value: CmcdValue) => formatNumbers(value, Math.round)

const toUrlSafe = (value: CmcdValue, options: CmcdFormatterOptions): ValueOrArray<string | SfItem<string>> => {
	if (Array.isArray(value)) {
		return value.map(item => toUrlSafe(item, options) as string)
	}

	if (value instanceof SfItem && typeof value.value === 'string') {
		return new SfItem(toUrlSafe(value.value, options), value.params)
	}
	else {
		if (options.baseUrl) {
			value = urlToRelativePath(value as string, getBaseUrl(options.baseUrl))
		}
		return options.version === 1 ? encodeURIComponent(value as string) : (value as string)
	}
}

const roundToHundred = (value: number): number => Math.round(value / 100) * 100

const toHundred = (value: CmcdValue) => formatNumbers(value, roundToHundred)

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

	/**
	 * Target Buffer Length (milliseconds) rounded nearest 100ms
	 */
	tbl: toHundred,

	/**
	 * Aggregate Encoded Bitrate (kbps) rounded integer
	 */
	ab: toRounded,

	/**
	 * Buffer Starvation Absolute (count) rounded integer
	 */
	bsa: toRounded,

	/**
	 * Buffer Starvation Duration (milliseconds) rounded integer
	 */
	bsd: toRounded,

	/**
	 * Buffer Starvation Duration Absolute (milliseconds) rounded integer
	 */
	bsda: toRounded,

	/**
	 * Dropped Frames Absolute (count) rounded integer
	 */
	dfa: toRounded,

	/**
	 * Lowest Aggregated Encoded Bitrate (kbps) rounded integer
	 */
	lab: toRounded,

	/**
	 * Lowest Encoded Bitrate (kbps) rounded integer
	 */
	lb: toRounded,

	/**
	 * Live Stream Latency (milliseconds) rounded integer
	 */
	ltc: toRounded,

	/**
	 * Media Start Delay (milliseconds) rounded integer
	 */
	msd: toRounded,

	/**
	 * Playhead Bitrate (kbps) rounded integer
	 */
	pb: toRounded,

	/**
	 * Playhead Time (milliseconds) rounded integer
	 */
	pt: toRounded,

	/**
	 * Response Code rounded integer
	 */
	rc: toRounded,

	/**
	 * Sequence Number rounded integer
	 */
	sn: toRounded,

	/**
	 * Top Aggregated Encoded Bitrate (kbps) rounded integer
	 */
	tab: toRounded,

	/**
	 * Top Playable Bitrate (kbps) rounded integer
	 */
	tpb: toRounded,

	/**
	 * Timestamp (milliseconds) rounded integer
	 */
	ts: toRounded,

	/**
	 * Time To First Byte (milliseconds) rounded integer
	 */
	ttfb: toRounded,

	/**
	 * Time To First Body Byte (milliseconds) rounded integer
	 */
	ttfbb: toRounded,

	/**
	 * Time To Last Byte (milliseconds) rounded integer
	 */
	ttlb: toRounded,
} as const
