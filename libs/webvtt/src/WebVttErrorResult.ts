import type { TypedResult } from '@svta/cml-utils';
import type { WebVttParsingError } from './WebVttParsingError.js';

/**
 * WebVTT transform stream error result.
 *
 *
 * @beta
 */
export type WebVttErrorResult = TypedResult<'error', WebVttParsingError>;
