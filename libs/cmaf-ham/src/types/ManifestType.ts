export const ManifestType = {
	DYNAMIC: 'dynamic',
	STATIC: 'static',
} as const

export type ManifestType = (typeof ManifestType)[keyof typeof ManifestType];
