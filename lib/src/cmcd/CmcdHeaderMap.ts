import { CmcdHeaderField } from './CmcdHeaderField.js';
import type { CmcdHeadersMap } from './CmcdHeadersMap.js';

/**
 * The map of CMCD header fields to official CMCD keys.
 *
 * @internal
 *
 * @group CMCD
 */
export const CmcdHeaderMap: CmcdHeadersMap = {
	[CmcdHeaderField.OBJECT]: ['br', 'ab', 'd', 'ot', 'tb', 'tpb', 'lb', 'tab', 'lab', 'url'],
	[CmcdHeaderField.REQUEST]: ['pb', 'bl', 'tbl', 'dl', 'ltc', 'mtp', 'nor', 'nrr', 'rc', 'sn', 'sta', 'su', 'ttfb', 'ttfbb', 'ttlb', 'cmsdd', 'cmsds', 'smrt', 'df', 'cs'],
	[CmcdHeaderField.SESSION]: ['cid', 'pr', 'sf', 'sid', 'st', 'v', 'msd'],
	[CmcdHeaderField.STATUS]: ['bs', 'bsd', 'cdn', 'rtp', 'bg', 'pt', 'ec', 'e'],
};
