import { CmcdObjectType } from './CmcdObjectType.js';
import { CmcdStreamingFormat } from './CmcdStreamingFormat.js';
import { CmcdStreamType } from './CmcdStreamType.js';

export type CmcdValue = CmcdObjectType | CmcdStreamingFormat | CmcdStreamType | string | number | boolean | symbol | undefined;
