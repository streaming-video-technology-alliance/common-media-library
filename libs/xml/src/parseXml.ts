import { decodeXml } from './decodeXml.ts'

/**
 * Parse XML into a JS object with no validation and some failure tolerance
 *
 * @param input - The input XML string
 * @param options - Optional parsing options
 * @returns The parsed XML
 *
 * @beta
 *
 * @deprecated Use {@link decodeXml} instead.
 */
export const parseXml: typeof decodeXml = decodeXml
