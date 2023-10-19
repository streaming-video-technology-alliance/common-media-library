import { CmObjectType } from './CmObjectType.js';
import { CmStreamingFormat } from './CmStreamingFormat.js';
import { CmStreamType } from './CmStreamType.js';

/**
 * A common media value.
 */
export type CmValue = CmObjectType | CmStreamingFormat | CmStreamType | string | number | boolean | symbol;
