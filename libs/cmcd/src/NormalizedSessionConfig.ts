import type { CmcdHeaderMap } from './CmcdHeaderMap.ts'
import type { CmcdRequestTransform } from './CmcdRequestTransform.ts'
import type { CmcdRequester } from './CmcdRequester.ts'
import type { CmcdTransmissionMode } from './CmcdTransmissionMode.ts'
import type { CmcdVersion } from './CmcdVersion.ts'
import type { NormalizedEventTarget } from './NormalizedEventTarget.ts'

/** The session configuration with every default applied. The request-mode members change through `configure()`. */
export type NormalizedSessionConfig = {
	version: CmcdVersion
	transmissionMode: CmcdTransmissionMode
	keys: ReadonlySet<string> | undefined
	headerMap: Partial<CmcdHeaderMap> | undefined
	readonly transform: CmcdRequestTransform | undefined
	readonly eventTargets: readonly NormalizedEventTarget[]
	readonly requester: CmcdRequester
	readonly derive: { readonly bg: boolean; readonly dl: boolean; readonly su: boolean }
	readonly onError: ((error: unknown) => void) | undefined
}
