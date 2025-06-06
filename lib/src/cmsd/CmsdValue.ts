import type { SfToken } from '../structuredfield/SfToken.js';
import type { CmsdObjectType } from './CmsdObjectType.js';
import type { CmsdStreamType } from './CmsdStreamType.js';
import type { CmsdStreamingFormat } from './CmsdStreamingFormat.js';

/**
 * CMSD Value
 *
 * @group CMSD
 *
 * @beta
 */
export type CmsdValue = CmsdObjectType | CmsdStreamingFormat | CmsdStreamType | string | number | boolean | symbol | SfToken;
