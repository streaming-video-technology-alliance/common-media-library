import type { KeySystemMap } from './KeySystemMap.ts'
import type { ProtectionScheme } from './ProtectionScheme.ts'

/**
 * CMAF-HAM Protection type
 *
 * @alpha
 */
export type Protection = {
	defaultKid: string;
	keySystems: KeySystemMap;
	scheme: ProtectionScheme;
}
