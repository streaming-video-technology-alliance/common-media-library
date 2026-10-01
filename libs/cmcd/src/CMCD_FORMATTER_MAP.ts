import { SfItem } from '@svta/cml-structured-field-values'
import type { ValueOrArray } from '@svta/cml-utils'
import type { CmcdFormatter } from './CmcdFormatter.ts'
import type { CmcdFormatterOptions } from './CmcdFormatterOptions.ts'
import type { CmcdValue } from './CmcdValue.ts'
import { formatNor } from './formatNor.ts'
import { isValid } from './isValid.ts'

const formatNumbers = (value: CmcdValue, format: (value: number) => number): ValueOrArray<number | SfItem<number>> => {
	if (Array.isArray(value)) {
		const list: (number | SfItem<number>)[] = []

		for (const item of value) {
			const formatted = formatNumbers(item, format) as number | SfItem<number>

			if (Number.isFinite(formatted instanceof SfItem ? formatted.value : formatted)) {
				list.push(formatted)
			}
		}

		return list
	}

	if (value instanceof SfItem) {
		const formatted = formatNumbers(value.value as CmcdValue, format)
		return isValid(formatted) ? new SfItem(formatted, value.params) : NaN
	}

	return typeof value === 'number' ? format(value) : NaN
}

const toRounded = (value: CmcdValue) => formatNumbers(value, Math.round)

const toNumber = (value: CmcdValue) => formatNumbers(value, Number)

const roundToHundred = (value: number): number => Math.round(value / 100) * 100

const toHundred = (value: CmcdValue) => formatNumbers(value, roundToHundred)

/**
 * The default formatters for CMCD values.
 *
 * The formatter of a numeric key drops a value or a list element that is not a finite number.
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
	nor: (value: CmcdValue, options: CmcdFormatterOptions) => formatNor(value, options) ?? '',

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
	 * Playback Rate decimal, not rounded
	 */
	pr: toNumber,

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
