import { urlToRelativePath } from '../utils/urlToRelativePath.js';
import { CmcdEncodeOptions } from './CmcdEncodeOptions.js';
import { CmcdFormatter } from './CmcdFormatter.js';
import { CmcdValue } from './CmcdValue.js';

const toRounded = (value: CmcdValue) => Math.round(value as number);
const toUrlSafe = (value: CmcdValue, options?: CmcdEncodeOptions) => {
	if (options?.baseUrl) {
		value = urlToRelativePath(value as string, options.baseUrl);
	}
	return encodeURIComponent(value as string);
};
const toHundred = (value: CmcdValue) => toRounded(value as number / 100) * 100;

/**
 * The default formatters for CMCD values.
 *
 * @group CMCD
 *
 * @beta
 */
export const CmcdFormatters: Record<string, CmcdFormatter> = {
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
};
