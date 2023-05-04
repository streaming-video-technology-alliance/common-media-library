import { CmcdHeadersMap } from './CmcdHeadersMap.js';
import { CmcdKey } from './CmcdKey.js';
import { CmcdValue } from './CmcdValue.js';

export interface CmcdEncodeOptions {
  formatters?: Record<CmcdKey, (value: CmcdValue) => number | string>;
  customHeaderMap?: CmcdHeadersMap;
}
