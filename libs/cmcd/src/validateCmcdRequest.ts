import type { HttpRequest } from '@svta/cml-utils'
import { CMCD_PARAM } from './CMCD_PARAM.ts'
import { type CmcdHeaderField, CMCD_HEADER_FIELDS } from './CmcdHeaderField.ts'
import { CMCD_REQUEST_MODE } from './CmcdReportingMode.ts'
import type { CmcdValidationOptions } from './CmcdValidationOptions.ts'
import type { CmcdValidationResult } from './CmcdValidationResult.ts'
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
 * @returns The validation result.
 *
 * @public
 */
export function validateCmcdRequest(request: Request | HttpRequest, options?: Omit<CmcdValidationOptions, 'reportingMode'>): CmcdValidationResult {
	const headers = request.headers instanceof Headers ? extractHeaderRecord(request.headers) : request.headers

	if (headers) {
		return validateCmcdHeaders(headers, options)
	}

	const param = new URL(request.url).searchParams.get(CMCD_PARAM)
	const data = decodeCmcd(param as string)

	return validateCmcd(data, { ...options, reportingMode: CMCD_REQUEST_MODE })
}

function extractHeaderRecord(headers: Headers): Partial<Record<CmcdHeaderField, string>> {
	const result: Partial<Record<CmcdHeaderField, string>> = {}

	for (const field of CMCD_HEADER_FIELDS) {
		const value = headers.get(field)

		if (value) {
			result[field] = value
		}
	}

	return result
}
