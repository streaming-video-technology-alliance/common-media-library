import type { TypedResult } from '../utils/TypedResult.js';
import type { WebVttCue } from './WebVttCue.js';

/**
 * WebVTT transform stream cue result.
 *
 * @group WebVTT
 *
 * @beta
 */
export type WebVttCueResult = TypedResult<'cue', WebVttCue>;
