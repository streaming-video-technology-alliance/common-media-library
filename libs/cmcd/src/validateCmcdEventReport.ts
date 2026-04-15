import type { HttpRequest } from '@svta/cml-utils'
import { CMCD_MIME_TYPE } from './CMCD_MIME_TYPE.ts'
import type { CmcdEventsValidationResult } from './CmcdEventsValidationResult.ts'
import type { CmcdValidationOptions } from './CmcdValidationOptions.ts'
import { CMCD_VALIDATION_SEVERITY_ERROR } from './CmcdValidationSeverity.ts'
import { ensureHeaders } from './ensureHeaders.ts'
import { validateCmcdEvents } from './validateCmcdEvents.ts'

/**
 * Validates a full HTTP request as an event-mode payload.
 *
 * Accepts an {@link @svta/cml-utils!HttpRequest | HttpRequest} object.
 *
 * This function validates that the request uses the POST method and has
 * the correct `Content-Type` header (`application/cmcd`) in addition to
 * validating the body content via {@link validateCmcdEvents}.
 *
 * @param request - An `HttpRequest` to validate.
 * @param options - Validation options (excluding `reportingMode`).
 * @returns The validation result including decoded data per event line.
 *
 * @example {@includeCode ../test/validateCmcdEventReport.test.ts#example}
 *
 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#event-mode | CTA-5004-B Event Mode}
 *
 * @public
 */
export function validateCmcdEventReport(request: HttpRequest, options?: Omit<CmcdValidationOptions, 'reportingMode'>): CmcdEventsValidationResult {
	const issues: CmcdEventsValidationResult['issues'] = []

	if (request.method !== 'POST') {
		issues.push({
			message: `Invalid HTTP method '${request.method ?? 'GET'}'. Event reports must use POST.`,
			severity: CMCD_VALIDATION_SEVERITY_ERROR,
		})
	}

	const contentType = request.headers ? ensureHeaders(request.headers).get('Content-Type') : undefined

	if (!contentType) {
		issues.push({
			message: `Missing Content-Type header. Event reports must use '${CMCD_MIME_TYPE}'.`,
			severity: CMCD_VALIDATION_SEVERITY_ERROR,
		})
	} else {
		const mediaType = contentType.split(';')[0].trim().toLowerCase()
		if (mediaType !== CMCD_MIME_TYPE) {
			issues.push({
				message: `Invalid Content-Type '${mediaType}'. Event reports must use '${CMCD_MIME_TYPE}'.`,
				severity: CMCD_VALIDATION_SEVERITY_ERROR,
			})
		}
	}

	const body = request.body
	if (body === undefined || body === null) {
		issues.push({
			message: 'Missing request body. Event reports must include a body.',
			severity: CMCD_VALIDATION_SEVERITY_ERROR,
		})
		return {
			valid: false,
			issues,
			data: [],
		}
	}

	if (typeof body !== 'string') {
		issues.push({
			message: 'Request body must be a string.',
			severity: CMCD_VALIDATION_SEVERITY_ERROR,
		})
		return {
			valid: false,
			issues,
			data: [],
		}
	}

	const bodyResult = validateCmcdEvents(body, options)

	return {
		valid: issues.length === 0 && bodyResult.valid,
		issues: [...issues, ...bodyResult.issues],
		data: bodyResult.data,
	}
}
