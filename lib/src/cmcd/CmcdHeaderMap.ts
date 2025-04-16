import { CmcdHeaderField } from './CmcdHeaderField.ts';
import type { CmcdHeadersMap } from './CmcdHeadersMap.ts';

/**
 * The map of CMCD header fields to official CMCD keys.
 *
 * @internal
 *
 * @group CMCD
 */
export const CmcdHeaderMap: CmcdHeadersMap = {
	[CmcdHeaderField.OBJECT]: ['br', 'd', 'ot', 'tb'],
	[CmcdHeaderField.REQUEST]: ['bl', 'dl', 'mtp', 'nor', 'nrr', 'su'],
	[CmcdHeaderField.SESSION]: ['cid', 'pr', 'sf', 'sid', 'st', 'v'],
	[CmcdHeaderField.STATUS]: ['bs', 'rtp'],
};
