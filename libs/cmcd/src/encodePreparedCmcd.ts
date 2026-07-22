import { encodeSfDict } from '@svta/cml-structured-field-values'
import type { Cmcd } from './Cmcd.ts'

/**
 * Encode already-prepared CMCD data to a structured field dictionary string.
 *
 * Members that cannot be serialized per RFC 8941 (control-character strings,
 * out-of-range numbers, invalid token content) are omitted so a single bad
 * value costs only its own key, never the report.
 *
 * @param data - The prepared CMCD data to encode.
 * @returns The encoded CMCD string.
 *
 * @internal
 */
export function encodePreparedCmcd(data: Cmcd): string {
	return encodeSfDict(data, { whitespace: false, skipUnserializable: true })
}
