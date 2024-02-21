import type { SfToken } from '../structuredfield/SfToken';
import type { CmcdObjectType } from './CmcdObjectType';
import type { CmcdStreamType } from './CmcdStreamType';
import type { CmcdStreamingFormat } from './CmcdStreamingFormat';

/**
 * CMCD Value
 *
 * @group CMCD
 *
 * @beta
 */
export type CmcdValue = CmcdObjectType | CmcdStreamingFormat | CmcdStreamType | string | number | boolean | symbol | SfToken;
