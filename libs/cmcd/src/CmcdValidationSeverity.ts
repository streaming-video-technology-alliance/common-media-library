import type { ValueOf } from '@svta/cml-utils'

/**
 * CMCD validation severity level: error.
 *
 * @public
 */
export const CMCD_VALIDATION_SEVERITY_ERROR = 'error' as const

/**
 * CMCD validation severity level: warning.
 *
 * @public
 */
export const CMCD_VALIDATION_SEVERITY_WARNING = 'warning' as const

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
