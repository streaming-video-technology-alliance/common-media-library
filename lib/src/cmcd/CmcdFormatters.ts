import { CmcdValue } from './CmcdValue.js';

const toRounded = (value: CmcdValue) => Math.round(value as number);
const toUrlSafe = (value: CmcdValue) => encodeURIComponent(value as string);
const toHundred = (value: CmcdValue) => toRounded(value as number / 100) * 100;

/**
 * Formatters for CMCD values.
 * 
 * @internal
 * 
 * @group CMCD
 */
export const CmcdFormatters: Record<string, (value: CmcdValue) => number | string> = {
	br: toRounded,
	d: toRounded,
	bl: toHundred,
	dl: toHundred,
	mtp: toHundred,
	nor: toUrlSafe,
	rtp: toHundred,
	tb: toRounded,
};
