import type { TypedResult } from '@svta/cml-utils'
import type { WebVttRegion } from './WebVttRegion.ts'

/**
 * WebVTT transform stream region result.
 *
 * @public
 */
export type WebVttRegionResult = TypedResult<'region', WebVttRegion>;
