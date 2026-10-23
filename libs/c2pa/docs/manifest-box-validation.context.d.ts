// Declarations that the example check prepends to the blocks of manifest-box-validation.md.
declare const segmentUrls: string[]
declare const bytes: Uint8Array
declare const lastManifestId: string | null
declare const state: import('@svta/cml-c2pa').ManifestBoxValidationState | undefined
declare function verifyAnchorChain(anchorToken: unknown, instanceId: string | null): boolean
