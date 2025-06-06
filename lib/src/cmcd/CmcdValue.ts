import type { SfToken } from '../structuredfield/SfToken.js';
import type { CmcdObjectType } from './CmcdObjectType.js';
import type { CmcdStreamType } from './CmcdStreamType.js';
import type { CmcdStreamingFormat } from './CmcdStreamingFormat.js';

/**
 * CMCD Value
 *
 * @group CMCD
 *
 * @beta
 */
export type CmcdValue = CmcdObjectType | CmcdStreamingFormat | CmcdStreamType | string | number | boolean | symbol | SfToken;
