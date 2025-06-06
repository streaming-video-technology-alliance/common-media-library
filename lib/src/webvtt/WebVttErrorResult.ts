import type { TypedResult } from '../utils/TypedResult.js';
import type { WebVttParsingError } from './WebVttParsingError.js';

/**
 * WebVTT transform stream error result.
 *
 * @group WebVTT
 *
 * @beta
 */
export type WebVttErrorResult = TypedResult<'error', WebVttParsingError>;
