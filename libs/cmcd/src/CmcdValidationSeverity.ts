import type { ValueOf } from '@svta/cml-utils'

/**
 * CMCD validation severity level: error.
 */
export const CMCD_VALIDATION_SEVERITY_ERROR = 'error'

/**
 * CMCD validation severity level: warning.
 */
export const CMCD_VALIDATION_SEVERITY_WARNING = 'warning'

/**
 * CMCD validation severity level.
 *
 * @public
 */
export const CmcdValidationSeverity = {
	ERROR: CMCD_VALIDATION_SEVERITY_ERROR as typeof CMCD_VALIDATION_SEVERITY_ERROR,
	WARNING: CMCD_VALIDATION_SEVERITY_WARNING as typeof CMCD_VALIDATION_SEVERITY_WARNING,
} as const

/**
 * CMCD validation severity level.
 *
 * @public
 */
export type CmcdValidationSeverity = ValueOf<typeof CmcdValidationSeverity>;
