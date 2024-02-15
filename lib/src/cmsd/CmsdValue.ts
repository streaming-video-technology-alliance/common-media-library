import type { SfToken } from '../structuredfield/SfToken';
import type { CmsdObjectType } from './CmsdObjectType';
import type { CmsdStreamType } from './CmsdStreamType';
import type { CmsdStreamingFormat } from './CmsdStreamingFormat';

/**
 * CMSD Value
 *
 * @group CMSD
 *
 * @beta
 */
export type CmsdValue = CmsdObjectType | CmsdStreamingFormat | CmsdStreamType | string | number | boolean | symbol | SfToken;
