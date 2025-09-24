import type { WebVttCueResult } from './WebVttCueResult.js';
import type { WebVttErrorResult } from './WebVttErrorResult.js';
import type { WebVttRegionResult } from './WebVttRegionResult.js';
import type { WebVttStyleResult } from './WebVttStyleResult.js';
import type { WebVttTimestampMapResult } from './WebVttTimestampMapResult.js';

/**
 * WebVTT transform stream result.
 *
 * @group WebVTT
 *
 * @beta
 */
export type WebVttResult = WebVttCueResult | WebVttRegionResult | WebVttTimestampMapResult | WebVttStyleResult | WebVttErrorResult;
