import type { TypedResult } from '@svta/cml-utils'
import type { TimestampMap } from './TimestampMap.ts'

/**
 * WebVTT transform stream timestamp map result.
 *
 * @public
 */
export type WebVttTimestampMapResult = TypedResult<'timestampmap', TimestampMap>;
