import type { WebVttCueResult } from './WebVttCueResult.ts'
import type { WebVttErrorResult } from './WebVttErrorResult.ts'
import type { WebVttRegionResult } from './WebVttRegionResult.ts'
import type { WebVttStyleResult } from './WebVttStyleResult.ts'
import type { WebVttTimestampMapResult } from './WebVttTimestampMapResult.ts'

/**
 * WebVTT transform stream result.
 *
 * @public
 */
export type WebVttResult = WebVttCueResult | WebVttRegionResult | WebVttTimestampMapResult | WebVttStyleResult | WebVttErrorResult;
