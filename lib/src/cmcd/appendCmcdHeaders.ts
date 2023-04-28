import { Cmcd } from './Cmcd.js';
import { CmcdCustomKey } from './CmcdCustomKey.js';
import { CmcdHeaderField } from './CmcdHeaderField.js';
import { toCmcdHeaders } from './toCmcdHeaders.js';

/**
 * Append CMCD query args to a header object.
 */
export function appendCmcdHeaders(headers: Record<string, string>, cmcd: Cmcd, customHeaderMap?: Record<CmcdCustomKey, CmcdHeaderField>) {
	return Object.assign(headers, toCmcdHeaders(cmcd, customHeaderMap));
}
