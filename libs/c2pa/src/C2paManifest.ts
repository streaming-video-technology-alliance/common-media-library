import type { C2paAssertion } from './C2paAssertion.ts'
import type { C2paSignatureInfo } from './C2paSignatureInfo.ts'

/**
 * A C2PA manifest (the active manifest within a manifest store)
 *
 * @public
 */
export type C2paManifest = {
	readonly label: string
	readonly instanceId: string | null
	readonly claimGenerator: string | null
	readonly signatureInfo: C2paSignatureInfo
	readonly assertions: readonly C2paAssertion[]
}