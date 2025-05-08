import type { ValueOf } from '../utils/ValueOf.ts';
import { UTF_16 } from './UTF_16.ts';
import { UTF_8 } from './UTF_8.ts';

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
} as const;

/**
 * Text encoding types.
 *
 * @group Utils
 *
 * @beta
 */
export type Encoding = ValueOf<typeof Encoding>;
