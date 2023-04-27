import { Cmcd } from './Cmcd.js';
import { CmcdCustomKey } from './CmcdCustomKey.js';
import { CmcdHeaderField } from './CmcdHeaderField.js';
import { toHeaders } from './toHeaders.js';

/**
 * Append CMCD query args to a header object.
 */
export function appendToHeaders(headers: Record<string, string>, cmcd: Cmcd, customHeaderMap?: Record<CmcdCustomKey, CmcdHeaderField>) {
	return Object.assign(headers, toHeaders(cmcd, customHeaderMap));
}
