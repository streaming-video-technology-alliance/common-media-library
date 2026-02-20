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

function reduceValue(value: ReduceValueInput): ReduceValueOutput {
	if (Array.isArray(value)) {
		return value.map(reduceValue)
	}

	if (typeof value === 'symbol') {
		return symbolToStr(value)
	}

	if (value instanceof SfItem && !value.params) {
		return reduceValue(value.value)
	}

	if (typeof value === 'string') {
		return decodeURIComponent(value)
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
 * @public
 *
 * @example
 * {@includeCode ../test/decodeCmcd.test.ts#example}
 */
/** @public */
export function decodeCmcd(cmcd: string, options: CmcdDecodeOptions & { convertToLatest: true }): Cmcd
/** @public */
export function decodeCmcd<T extends CmcdData = CmcdData>(cmcd: string, options?: CmcdDecodeOptions): T
export function decodeCmcd(cmcd: string, options?: CmcdDecodeOptions): CmcdData | Cmcd {
	if (!cmcd) {
		return {} as CmcdData
	}

	const sfDict = decodeSfDict(cmcd)

	const result = Object
		.entries<SfItem>(sfDict as any)
		.reduce((acc, [key, item]) => {
			acc[key] = reduceValue(item.value) as any
			return acc
		}, {} as Record<string, any>)

	if (options?.convertToLatest) {
		return upConvertToV2(result) as Cmcd
	}

	return result as CmcdData
}
