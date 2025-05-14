import type { SfToken } from '../structuredfield/SfToken';
import type { CmObjectType } from './CmObjectType';
import type { CmStreamingFormat } from './CmStreamingFormat';
import type { CmStreamType } from './CmStreamType';

/**
 * A common media value.
 *
 * @internal
 */
export type CmValue = CmObjectType | CmStreamingFormat | CmStreamType | string | number | boolean | symbol | SfToken;
