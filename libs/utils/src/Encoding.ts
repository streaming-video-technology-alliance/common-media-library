import { UTF_16 } from './UTF_16.ts';
import { UTF_16_BE } from './UTF_16_BE.ts';
import { UTF_16_LE } from './UTF_16_LE.ts';
import { UTF_8 } from './UTF_8.ts';
import type { ValueOf } from './ValueOf.ts';

/**
 * Text encoding types.
 *
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
 *
 * @beta
 */
export type Encoding = ValueOf<typeof Encoding>;
