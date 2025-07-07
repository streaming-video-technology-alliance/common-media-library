import { symbolToStr } from '../cta/utils/symbolToStr.js';
import type { SfBareItem } from '../structuredfield/SfBareItem.js';
import { SfItem } from '../structuredfield/SfItem.js';
import { decodeSfDict } from '../structuredfield/decodeSfDict.js';
import type { CmcdData } from './CmcdData.js';
import type { CmcdValue } from './CmcdValue.js';

// Define the input type for reduceValue
type ReduceValueInput = SfBareItem | SfItem | ReduceValueInput[];

// Define the output type for reduceValue - matches what CMCD values can be, including arrays
type ReduceValueOutput = CmcdValue | ReduceValueOutput[];

function reduceValue(value: ReduceValueInput): ReduceValueOutput {
	if (Array.isArray(value)) {
		return value.map(reduceValue);
	}

	if (typeof value === 'symbol') {
		return symbolToStr(value);
	}

	if (value instanceof SfItem && !value.params) {
		return reduceValue(value.value);
	}

	if (typeof value === 'string') {
		return decodeURIComponent(value);
	}

	return value as ReduceValueOutput;
};

/**
 * Decode a CMCD string to an object.
 *
 * @param cmcd - The CMCD string to decode.
 *
 * @returns The decoded CMCD object.
 *
 * @group CMCD
 *
 * @beta
 *
 * @example
 * {@includeCode ../../test/cmcd/decodeCmcd.test.ts#example}
 */
export function decodeCmcd<T extends CmcdData = CmcdData>(cmcd: string): T {
	if (!cmcd) {
		return {} as T;
	}

	const sfDict = decodeSfDict(cmcd);

	return Object
		.entries<SfItem>(sfDict as any)
		.reduce((acc, [key, item]) => {
			acc[key as keyof T] = reduceValue(item.value) as T[keyof T];
			return acc;
		}, {} as T);
}
