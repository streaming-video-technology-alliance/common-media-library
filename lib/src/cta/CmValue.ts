import type { SfToken } from '../structuredfield/SfToken.ts';
import type { CmObjectType } from './CmObjectType.ts';
import type { CmStreamingFormat } from './CmStreamingFormat.ts';
import type { CmStreamType } from './CmStreamType.ts';

/**
 * A common media value.
 *
 * @internal
 */
export type CmValue = CmObjectType | CmStreamingFormat | CmStreamType | string | number | boolean | symbol | SfToken;
