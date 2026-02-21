import { CMCD_V1 } from './CMCD_V1.ts'
import type { CmcdValidationOptions } from './CmcdValidationOptions.ts'

/**
 * Resolves the CMCD version from explicit options, the payload's `v` key, or the default (v1).
 *
 * @internal
 */
export function resolveVersion(data: Record<string, unknown>, options?: CmcdValidationOptions): number {
	if (options?.version === 1 || options?.version === 2) {
		return options.version
	}

	const payloadVersion = data['v']
	if (payloadVersion === 1 || payloadVersion === 2) {
		return payloadVersion
	}

	return CMCD_V1
}
