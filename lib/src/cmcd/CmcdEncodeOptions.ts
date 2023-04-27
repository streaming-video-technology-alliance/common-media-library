import { URLSearchParams } from 'url';
import { CmcdCustomKey } from './CmcdCustomKey.js';
import { CmcdHeaderField } from './CmcdHeaderField.js';
import { CmcdKey } from './CmcdKey.js';
import { CmcdValue } from './CmcdValue.js';

export interface CmcdEncodeOptions {
  formatters?: Record<CmcdKey, (value: CmcdValue) => number | string>;
  searchParams?: URLSearchParams;
  headers?: Headers;
  customHeaderMap?: Record<CmcdCustomKey, CmcdHeaderField>;
}
