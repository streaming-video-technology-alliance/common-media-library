import type { HttpRequest } from '@svta/cml-utils'
import { CMCD_PARAM } from './CMCD_PARAM.ts'
import type { CmcdData } from './CmcdData.ts'
import type { CmcdDataValidationResult } from './CmcdDataValidationResult.ts'
import { type CmcdHeaderField, CMCD_HEADER_FIELDS } from './CmcdHeaderField.ts'
import { CMCD_REQUEST_MODE } from './CmcdReportingMode.ts'
import type { CmcdValidationOptions } from './CmcdValidationOptions.ts'
import type { CmcdValidationResult } from './CmcdValidationResult.ts'
import { CMCD_VALIDATION_SEVERITY_ERROR } from './CmcdValidationSeverity.ts'
import { decodeCmcd } from './decodeCmcd.ts'
import { ensureHeaders } from './ensureHeaders.ts'
import { mergeValidationResults } from './mergeValidationResults.ts'
import { validateCmcd } from './validateCmcd.ts'
import { validateCmcdHeaders } from './validateCmcdHeaders.ts'

/**
 * Validates CMCD data from a request as a request-mode payload.
 *
 * Accepts a
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Request | Request}
 * object or an {@link @svta/cml-utils!HttpRequest | HttpRequest} object.
 *
 * The function checks for CMCD data in the HTTP headers first. If CMCD
 * headers are found, validation includes shard-placement checks via
 * {@link validateCmcdHeaders}. Otherwise, the CMCD query parameter is
 * extracted from the URL and validated. A request that carries CMCD data
 * in both the headers and the `CMCD` query parameter is an error. The
 * headers are still validated and their data is returned.
 *
 * @param request - A `Request` or `HttpRequest` to validate.
 * @param options - Validation options (excluding `reportingMode`).
 * @returns The validation result including decoded data.
 *
 * @example
 * {@includeCode ../test/validateCmcdRequest.test.ts#example}
 *
 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#request-mode | CTA-5004-B Request Mode}
 *
 * @public
 */
export function validateCmcdRequest(request: Request | HttpRequest, options?: Omit<CmcdValidationOptions, 'reportingMode'>): CmcdDataValidationResult {
	const headers = extractHeaderRecord(request.headers)
	const param = getCmcdQueryParam(request.url)

	if (headers) {
		const result = validateCmcdHeaders(headers, options)

		if (!param) {
			return result
		}

		const conflict: CmcdValidationResult = {
			valid: false,
			issues: [{
				message: 'CMCD data found in both request headers and the "CMCD" query parameter. A request must use only one transmission mode.',
				severity: CMCD_VALIDATION_SEVERITY_ERROR,
			}],
		}

		return { ...mergeValidationResults(conflict, result), data: result.data }
	}

	if (!param) {
		return {
			valid: false,
			issues: [{
				message: 'No CMCD data found in request headers or query parameters.',
				severity: CMCD_VALIDATION_SEVERITY_ERROR,
			}],
			data: {} as CmcdData,
		}
	}

	let data: CmcdData
	try {
		data = decodeCmcd(param)
	} catch {
		return {
			valid: false,
			issues: [{
				message: 'Failed to decode CMCD query parameter: invalid structured field syntax.',
				severity: CMCD_VALIDATION_SEVERITY_ERROR,
			}],
			data: {} as CmcdData,
		}
	}

	const result = validateCmcd(data, { ...options, reportingMode: CMCD_REQUEST_MODE })
	return { ...result, data }
}

function getCmcdQueryParam(url: string): string | null {
	const start = url.indexOf('?')

	if (start < 0) {
		return null
	}

	const end = url.indexOf('#', start)

	return new URLSearchParams(url.slice(start + 1, end < 0 ? url.length : end)).get(CMCD_PARAM)
}

function extractHeaderRecord(headers: Headers | Record<string, string> | undefined): Partial<Record<CmcdHeaderField, string>> | undefined {
	if (!headers) {
		return undefined
	}

	const h = ensureHeaders(headers)
	const result: Partial<Record<CmcdHeaderField, string>> = {}
	let found = false

	for (const field of CMCD_HEADER_FIELDS) {
		const value = h.get(field)

		if (value) {
			result[field] = value
			found = true
		}
	}

	return found ? result : undefined
}
