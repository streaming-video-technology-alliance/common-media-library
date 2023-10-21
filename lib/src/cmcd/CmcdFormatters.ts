import { CmcdValue } from './CmcdValue.js';

const toRounded = (value: CmcdValue) => Math.round(value as number);
const toUrlSafe = (value: CmcdValue) => encodeURIComponent(value as string);
const toHundred = (value: CmcdValue) => toRounded(value as number / 100) * 100;

/**
 * The default formatters for CMCD values.
 * 
 * @group CMCD
 */
export const CmcdFormatters: Record<string, (value: CmcdValue) => number | string | boolean> = {
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
