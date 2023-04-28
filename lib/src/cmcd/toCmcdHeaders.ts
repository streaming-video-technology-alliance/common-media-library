import { Cmcd } from './Cmcd.js';
import { CmcdCustomKey } from './CmcdCustomKey.js';
import { CmcdEncodeOptions } from './CmcdEncodeOptions.js';
import { CmcdHeaderField } from './CmcdHeaderField.js';
import { CmcdKey } from './CmcdKey.js';
import { CmcdValue } from './CmcdValue.js';
import { encodeCmcd } from './encodeCmcd.js';

const headerMap: Record<CmcdKey, CmcdHeaderField> = {
	br: 0, d: 0, ot: 0, tb: 0,
	bl: 1, dl: 1, mtp: 1, nor: 1, nrr: 1, su: 1,
	cid: 2, pr: 2, sf: 2, sid: 2, st: 2, v: 2,
	bs: 3, rtp: 3,
};

const toHeaderCase = (value: string) => `${value[0].toUpperCase()}${value.slice(1).toLowerCase()}`;

/**
 * Convert a CMCD data object to request headers
 */
export function toCmcdHeaders(cmcd: Cmcd, options: CmcdEncodeOptions = {}) {
	const results: Record<string, string> = {};

	if (!cmcd) {
		return results;
	}

	const entries = Object.entries(cmcd) as [CmcdKey | CmcdCustomKey, CmcdValue][];
	const headerGroups: Record<string, CmcdValue>[] = [{}, {}, {}, {}];
	const customHeaderMap = options?.customHeaderMap || {};
	
	entries.forEach(([key, value]) => {
		let index = headerMap[key];
		if (index == null) {
			const custom = key as CmcdCustomKey;
			index = customHeaderMap[custom] != null ? customHeaderMap[custom] : CmcdHeaderField.REQUEST;
		}
		headerGroups[index][key] = value;
	});
	
	headerGroups.forEach((group, index) => {
		const value = encodeCmcd(group, options);
		if (!value) {
			return;
		}
		
		const shard = `CMCD-${toHeaderCase(CmcdHeaderField[index])}`;
		results[shard] = value;
	});

	return results;
}
