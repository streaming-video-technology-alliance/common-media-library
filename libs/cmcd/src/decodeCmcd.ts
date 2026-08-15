import type { SfBareItem } from '@svta/cml-structured-field-values'
import { decodeSfDict, SfItem, symbolToStr } from '@svta/cml-structured-field-values'
import type { Cmcd } from './Cmcd.ts'
import type { CmcdData } from './CmcdData.ts'
import type { CmcdDecodeOptions } from './CmcdDecodeOptions.ts'
import type { CmcdValue } from './CmcdValue.ts'
import { upConvertToV2 } from './upConvertToV2.ts'

// Define the input type for reduceValue
type ReduceValueInput = SfBareItem | SfItem | ReduceValueInput[];

// Define the output type for reduceValue - matches what CMCD values can be, including arrays
type ReduceValueOutput = CmcdValue | ReduceValueOutput[];

function reduceValue(value: ReduceValueInput, useSymbol: boolean | undefined): ReduceValueOutput {
	if (Array.isArray(value)) {
		return value.map(item => reduceValue(item, useSymbol))
	}

	// Tokens reduce to plain strings unless the caller opted into
	// preservation, where the parser's own representation passes through:
	// a registry symbol, or an SfToken when `useSymbol` is `false`. Both
	// re-encode as bare tokens, so preserved output round-trips.
	if (typeof value === 'symbol') {
		return useSymbol === undefined ? symbolToStr(value) : (value as unknown as ReduceValueOutput)
	}

	if (value instanceof SfItem) {
		// Params are data: an item that carries them stays an SfItem, with
		// its value reduced the same way a bare member's would be. Only
		// param-less wrappers unwrap.
		return value.params
			? new SfItem(reduceValue(value.value, useSymbol), value.params)
			: reduceValue(value.value, useSymbol)
	}

	return value as ReduceValueOutput
};

/**
 * Decode a CMCD string to an object.
 *
 * @param cmcd - The CMCD string to decode.
 * @param options - Options for decoding.
 *
 * @returns The decoded CMCD object.
 *
 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#payload-definition-for-headers-and-query-argument-transmission | CTA-5004-B Payload Definition}
 *
 * @public
 *
 * @example
 * {@includeCode ../test/decodeCmcd.test.ts#example}
 */
export function decodeCmcd(cmcd: string, options: CmcdDecodeOptions & { convertToLatest: true }): Cmcd
export function decodeCmcd<T extends CmcdData = CmcdData>(cmcd: string, options?: CmcdDecodeOptions): T
export function decodeCmcd(cmcd: string, options?: CmcdDecodeOptions): CmcdData | Cmcd {
	if (!cmcd) {
		return {} as CmcdData
	}

	const sfDict = decodeSfDict(cmcd, options)

	// Each dictionary member is reduced whole, not via `item.value`, so
	// member-level and inner-list-level params survive decoding.
	const result: Record<string, unknown> = {}
	for (const [key, item] of Object.entries(sfDict as Record<string, SfItem>)) {
		result[key] = reduceValue(item, options?.useSymbol)
	}

	if (options?.convertToLatest) {
		return upConvertToV2(result) as Cmcd
	}

	return result as CmcdData
}
