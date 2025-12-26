import type { TypedResult } from '@svta/cml-utils'
import type { WebVttCue } from './WebVttCue.ts'

/**
 * WebVTT transform stream cue result.
 *
 * @public
 */
export type WebVttCueResult = TypedResult<'cue', WebVttCue>;
