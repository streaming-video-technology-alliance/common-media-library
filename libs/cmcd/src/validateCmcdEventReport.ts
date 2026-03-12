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
 * Accepts a {@link https://developer.mozilla.org/en-US/docs/Web/API/Request | Request}
 * object or an {@link @svta/cml-utils!HttpRequest | HttpRequest} object.
 *
 * This function validates that the request uses the POST method and has
 * the correct `Content-Type` header (`application/cmcd`) in addition to
 * validating the body content via {@link validateCmcdEvents}.
 *
 * @param request - A `Request` or `HttpRequest` to validate.
 * @param options - Validation options (excluding `reportingMode`).
 * @returns The validation result including decoded data per event line.
 *
 * @example {@includeCode ../test/validateCmcdEventReport.test.ts#example}
 *
 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-a.html#event-mode | CTA-5004-A Event Mode}
 *
 * @public
 */
export function validateCmcdEventReport(request: Request | HttpRequest, options?: Omit<CmcdValidationOptions, 'reportingMode'>): CmcdEventsValidationResult {
	const issues: CmcdEventsValidationResult['issues'] = []

	const method = request instanceof Request ? request.method : request.method
	if (method !== 'POST') {
		issues.push({
			message: `Invalid HTTP method '${method ?? 'GET'}'. Event reports must use POST.`,
			severity: CMCD_VALIDATION_SEVERITY_ERROR,
		})
	}

	const headers = request instanceof Request ? request.headers : request.headers
	const contentType = headers ? ensureHeaders(headers).get('Content-Type') : undefined

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

	const body = request instanceof Request ? undefined : request.body
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
