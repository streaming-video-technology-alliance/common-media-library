import { SfItem } from '../structuredfield/SfItem.js';
import { urlToRelativePath } from '../utils/urlToRelativePath.js';
import type { ValueOrArray } from '../utils/ValueOrArray.js';
import type { CmcdEncodeOptions } from './CmcdEncodeOptions.js';
import type { CmcdFormatter } from './CmcdFormatter.js';
import type { CmcdValue } from './CmcdValue.js';

const toRounded = (value: CmcdValue) => Math.round(value as number);

const toUrlSafe = (value: CmcdValue, options?: CmcdEncodeOptions): ValueOrArray<string> | ValueOrArray<SfItem> => {
	if (Array.isArray(value)) {
		return value.map(item => toUrlSafe(item, options) as string);
	}

	if (value instanceof SfItem && typeof value.value === 'string') {
		return new SfItem(toUrlSafe(value.value, options), value.params);
	}
	else {
		if (options?.baseUrl) {
			value = urlToRelativePath(value as string, options.baseUrl);
		}
		return encodeURIComponent(value as string);
	}
};
const toHundred = (value: CmcdValue) => toRounded(value as number / 100) * 100;

/**
 * The default formatters for CMCD values.
 *
 * @group CMCD
 *
 * @beta
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
	nor: toUrlSafe,

	/**
	 * Requested maximum throughput (kbps) rounded nearest 100kbps
	 */
	rtp: toHundred,

	/**
	 * Top Bitrate (kbps) rounded integer
	 */
	tb: toRounded,
} as const;
