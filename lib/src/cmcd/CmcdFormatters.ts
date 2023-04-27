import { CmcdValue } from './CmcdValue.js';

const toRounded = (value: CmcdValue) => Math.round(value as number);
const toUrlSafe = (value: CmcdValue) => encodeURIComponent(value as string);

export const CmcdFormatters: Record<string, (value: CmcdValue) => number | string> = {
	br: toRounded,
	d: toRounded,
	bl: toRounded,
	dl: toRounded,
	mtp: toRounded,
	nor: toUrlSafe,
	rtp: toRounded,
};
