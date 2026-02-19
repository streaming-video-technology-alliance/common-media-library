import { CMCD_V1 } from './CMCD_V1.ts'
import type { CmcdValidationOptions } from './CmcdValidationOptions.ts'

/**
 * Resolves the CMCD version from explicit options, the payload's `v` key, or the default (v1).
 *
 * @internal
 */
export function resolveVersion(data: Record<string, unknown>, options?: CmcdValidationOptions): number {
	if (options?.version != null) {
		return options.version
	}

	if (typeof data['v'] === 'number') {
		return data['v']
	}

	return CMCD_V1
}
