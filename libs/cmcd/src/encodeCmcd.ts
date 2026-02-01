import { encodeSfDict } from '@svta/cml-structured-field-values'
import type { Cmcd } from './Cmcd.ts'
import type { CmcdEncodeOptions } from './CmcdEncodeOptions.ts'
import { prepareCmcdData } from './prepareCmcdData.ts'

/**
 * Encode a CMCD object to a string.
 *
 * @param cmcd - The CMCD object to encode.
 * @param options - Options for encoding.
 *
 * @returns The encoded CMCD string.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/encodeCmcd.test.ts#example}
 */
export function encodeCmcd(cmcd: Cmcd, options: CmcdEncodeOptions = {}): string {
	if (!cmcd) {
		return ''
	}

	return encodeSfDict(prepareCmcdData(cmcd, options), { whitespace: false })
}
