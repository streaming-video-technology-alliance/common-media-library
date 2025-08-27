import type { ValueOf } from '../utils/ValueOf.js';
import { UTF_16 } from './UTF_16.js';
import { UTF_16_BE } from './UTF_16_BE.js';
import { UTF_16_LE } from './UTF_16_LE.js';
import { UTF_8 } from './UTF_8.js';

/**
 * Text encoding types.
 *
 * @group Utils
 *
 * @beta
 */
export const Encoding = {
	UTF8: UTF_8 as typeof UTF_8,
	UTF16: UTF_16 as typeof UTF_16,
	UTF16BE: UTF_16_BE as typeof UTF_16_BE,
	UTF16LE: UTF_16_LE as typeof UTF_16_LE,
} as const;

/**
 * Text encoding types.
 *
 * @group Utils
 *
 * @beta
 */
export type Encoding = ValueOf<typeof Encoding>;
