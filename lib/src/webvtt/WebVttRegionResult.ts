import type { TypedResult } from '../utils/TypedResult.js';
import type { WebVttRegion } from './WebVttRegion.js';

/**
 * WebVTT transform stream region result.
 *
 * @group WebVTT
 *
 * @beta
 */
export type WebVttRegionResult = TypedResult<'region', WebVttRegion>;
