import type { Cmcd } from './Cmcd.ts'
import type { CmcdData } from './CmcdData.ts'
import type { CmcdDecodeOptions } from './CmcdDecodeOptions.ts'
import { decodeCmcd } from './decodeCmcd.ts'

/**
 * Decode CMCD data from a url encoded string.
 *
 * @param url - The url encoded string to decode.
 * @param options - Options for decoding.
 *
 * @returns The decoded CMCD data.
 *
 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-a.html#query-argument-definition | CTA-5004-A Query Argument Definition}
 *
 * @public
 *
 * @example
 * {@includeCode ../test/fromCmcdUrl.test.ts#example}
 */
export function fromCmcdUrl(url: string, options: CmcdDecodeOptions & { convertToLatest: true }): Cmcd
export function fromCmcdUrl(url: string, options?: CmcdDecodeOptions): CmcdData
export function fromCmcdUrl(url: string, options?: CmcdDecodeOptions): CmcdData | Cmcd {
	return decodeCmcd(decodeURIComponent(url.replace(/^CMCD=/, '')), options as CmcdDecodeOptions)
}
