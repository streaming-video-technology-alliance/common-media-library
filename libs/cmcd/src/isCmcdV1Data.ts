import { CMCD_V2 } from './CMCD_V2.ts'
import type { CmcdData } from './CmcdData.ts'
import type { CmcdV1Data } from './CmcdData.ts'

/**
 * Check if a CMCD data object is version 1.
 *
 * @param data - The CMCD data object to check.
 *
 * @returns `true` if the data is version 1, `false` otherwise.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/isCmcdV1Data.test.ts#example}
 */
export function isCmcdV1Data(data: CmcdData): data is CmcdV1Data {
	return data.v !== CMCD_V2
}
