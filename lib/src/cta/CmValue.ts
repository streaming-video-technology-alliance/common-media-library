import { SfToken } from '../structuredfield/SfToken.js';
import { CmObjectType } from './CmObjectType.js';
import { CmStreamingFormat } from './CmStreamingFormat.js';
import { CmStreamType } from './CmStreamType.js';

/**
 * A common media value.
 *
 * @internal
 */
export type CmValue = CmObjectType | CmStreamingFormat | CmStreamType | string | number | boolean | symbol | SfToken;
