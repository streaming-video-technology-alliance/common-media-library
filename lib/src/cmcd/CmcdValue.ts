import { CmcdObjectType } from './CmcdObjectType.js';
import { CmcdStreamingFormat } from './CmcdStreamingFormat.js';
import { CmcdStreamType } from './CmcdStreamType.js';

/**
 * A value that can be encoded in CMCD.
 * 
 * @group CMCD
 */
export type CmcdValue = CmcdObjectType | CmcdStreamingFormat | CmcdStreamType | string | number | boolean | symbol | undefined;
