import type { ValueOf } from '@svta/cml-utils'

// TODO: Should this be moved to the DRM library?
export const ProtectionScheme = {
	CENC: 'cenc',
	CBCS: 'cbcs',
} as const

export type ProtectionScheme = ValueOf<typeof ProtectionScheme>;
