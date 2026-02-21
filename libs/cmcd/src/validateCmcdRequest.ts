import type { HttpRequest } from '@svta/cml-utils'
import { CMCD_PARAM } from './CMCD_PARAM.ts'
import { type CmcdHeaderField, CMCD_HEADER_FIELDS } from './CmcdHeaderField.ts'
import type { CmcdDataValidationResult } from './CmcdDataValidationResult.ts'
import { ensureHeaders } from './ensureHeaders.ts'
import { CMCD_REQUEST_MODE } from './CmcdReportingMode.ts'
import type { CmcdValidationOptions } from './CmcdValidationOptions.ts'
import { decodeCmcd } from './decodeCmcd.ts'
import { validateCmcd } from './validateCmcd.ts'
import { validateCmcdHeaders } from './validateCmcdHeaders.ts'

/**
 * Validates CMCD data from a request as a request-mode payload.
 *
 * Accepts a
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Request | Request}
 * object or an {@link @svta/cml-utils#HttpRequest | HttpRequest} object.
 *
 * The function checks for CMCD data in the HTTP headers first. If CMCD
 * headers are found, validation includes shard-placement checks via
 * {@link validateCmcdHeaders}. Otherwise, the CMCD query parameter is
 * extracted from the URL and validated.
 *
 * {@includeCode ../test/validateCmcdRequest.test.ts#example}
 *
 * @param request - A `Request` or `HttpRequest` to validate.
 * @param options - Validation options (excluding `reportingMode`).
 * @returns The validation result including decoded data.
 *
 * @public
 */
export function validateCmcdRequest(request: Request | HttpRequest, options?: Omit<CmcdValidationOptions, 'reportingMode'>): CmcdDataValidationResult {
	const headers = extractHeaderRecord(request.headers)

	if (headers) {
		return validateCmcdHeaders(headers, options)
	}

	const param = new URL(request.url).searchParams.get(CMCD_PARAM)
	const data = decodeCmcd(param as string)

	const result = validateCmcd(data, { ...options, reportingMode: CMCD_REQUEST_MODE })
	return { ...result, data }
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
