import { CmcdHeadersMap } from './CmcdHeadersMap.js';
import { CmcdKey } from './CmcdKey.js';
import { CmcdValue } from './CmcdValue.js';

/**
 * Options for encoding CMCD values.
 * 
 * @group CMCD
 */
export interface CmcdEncodeOptions {
  /**
   * A map of CMCD keys to custom formatters.
   */
  formatters?: Record<CmcdKey, (value: CmcdValue) => number | string>;

  /**
   * A map of CMCD header fields to custom CMCD keys.
   */
  customHeaderMap?: CmcdHeadersMap;

  /**
   * A filter function for CMCD keys.
   * 
   * @param key - The CMCD key to filter. 
   * 
   * @returns `true` if the key should be included, `false` otherwise.
   */
  filter?: (key: CmcdKey) => boolean;

  /**
   * Use Symbol to represent token values
   * 
   * @defaultValue `true`
   */
  useSymbol?: boolean;
}
