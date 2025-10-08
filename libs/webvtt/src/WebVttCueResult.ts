import type { TypedResult } from '@svta/cml-utils/TypedResult.js';
import type { WebVttCue } from './WebVttCue.js';

/**
 * WebVTT transform stream cue result.
 *
 *
 * @beta
 */
export type WebVttCueResult = TypedResult<'cue', WebVttCue>;
