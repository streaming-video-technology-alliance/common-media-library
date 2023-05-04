import { CmcdHeaderField } from './CmcdHeaderField.js';
import { CmcdHeadersMap } from './CmcdHeadersMap.js';

export const CmcdHeaderMap: CmcdHeadersMap = {
	[CmcdHeaderField.OBJECT]: ['br', 'd', 'ot', 'tb'],
	[CmcdHeaderField.REQUEST]: ['bl', 'dl', 'mtp', 'nor', 'nrr', 'su'],
	[CmcdHeaderField.SESSION]: ['cid', 'pr', 'sf', 'sid', 'st', 'v'],
	[CmcdHeaderField.STATUS]: ['bs', 'rtp'],
};
