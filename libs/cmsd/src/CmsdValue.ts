import type { SfToken } from '@svta/cml-structured-field-values';
import type { CmsdObjectType } from './CmsdObjectType.js';
import type { CmsdStreamType } from './CmsdStreamType.js';
import type { CmsdStreamingFormat } from './CmsdStreamingFormat.js';

/**
 * CMSD Value
 *
 *
 * @beta
 */
export type CmsdValue = CmsdObjectType | CmsdStreamingFormat | CmsdStreamType | string | number | boolean | symbol | SfToken;
