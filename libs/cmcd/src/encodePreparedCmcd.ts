import { encodeSfDict } from '@svta/cml-structured-field-values'
import type { Cmcd } from './Cmcd.ts'

/**
 * Encode already-prepared CMCD data to a structured field dictionary string.
 *
 * @param data - The prepared CMCD data to encode.
 * @returns The encoded CMCD string.
 *
 * @internal
 */
export function encodePreparedCmcd(data: Cmcd): string {
	return encodeSfDict(data, { whitespace: false })
}
