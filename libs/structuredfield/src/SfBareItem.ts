import type { SfToken } from './SfToken.js';

/**
 * A type to represent structured field bare items.
 *
 *
 * @beta
 */
export type SfBareItem = string | Uint8Array | boolean | number | symbol | Date | SfToken;
