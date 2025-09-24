import type { SfToken } from '../SfToken.js';

/**
 * Converts a symbol to a string.
 *
 * @param symbol - The symbol to convert.
 *
 * @returns The string representation of the symbol.
 *
 * @group Structured Field
 *
 * @beta
 */
export function symbolToStr(symbol: symbol | SfToken): string {
	return symbol.description || symbol.toString().slice(7, -1);
}
