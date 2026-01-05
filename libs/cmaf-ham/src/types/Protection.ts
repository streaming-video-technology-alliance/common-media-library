import type { KeySystemMap } from './KeySystemMap.ts'
import type { ProtectionScheme } from './ProtectionScheme.ts'

export type Protection = {
	defaultKid: string;
	keySystems: KeySystemMap;
	scheme: ProtectionScheme;
}
