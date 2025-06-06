import type { TypedResult } from '../utils/TypedResult.js';
import type { TimestampMap } from './TimestampMap.js';

/**
 * WebVTT transform stream timestamp map result.
 *
 * @group WebVTT
 *
 * @beta
 */
export type WebVttTimestampMapResult = TypedResult<'timestampmap', TimestampMap>;
