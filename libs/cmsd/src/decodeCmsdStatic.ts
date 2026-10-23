import { decodeSfDict, SfItem, symbolToStr } from '@svta/cml-structured-field-values'
import type { CmsdStatic } from './CmsdStatic.ts'

/**
 * Decode a CMSD Static dict string to an object.
 *
 * @param cmsd - The CMSD string to decode.
 *
 * @returns The decoded CMSD object.
 *
 * @public
 */
export function decodeCmsdStatic(cmsd: string): CmsdStatic {
	if (!cmsd) {
		return {}
	}

	const result: Record<string, unknown> = {}

	const dict = decodeSfDict(cmsd)
	const entries = dict instanceof Map ? dict.entries() : Object.entries(dict)

	for (const [key, item] of entries) {
		const value = item instanceof SfItem ? item.value : item
		result[key] = typeof value === 'symbol' ? symbolToStr(value) : value
	}

	return result as CmsdStatic
}
