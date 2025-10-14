import type { SfToken } from './SfToken.ts';

/**
 * A type to represent structured field bare items.
 *
 *
 * @beta
 */
export type SfBareItem = string | Uint8Array | boolean | number | symbol | Date | SfToken;
