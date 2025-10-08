import type { TypedResult } from '@svta/cml-utils/TypedResult.js';
import type { TimestampMap } from './TimestampMap.js';

/**
 * WebVTT transform stream timestamp map result.
 *
 *
 * @beta
 */
export type WebVttTimestampMapResult = TypedResult<'timestampmap', TimestampMap>;
