import type { CmcdEventTargetConfig } from './CmcdEventTargetConfig.ts'
import type { CmcdHeaderMap } from './CmcdHeaderMap.ts'
import type { CmcdKey } from './CmcdKey.ts'
import type { CmcdRequestTransform } from './CmcdRequestTransform.ts'
import type { CmcdRequester } from './CmcdRequester.ts'
import type { CmcdTransmissionMode } from './CmcdTransmissionMode.ts'
import type { CmcdVersion } from './CmcdVersion.ts'

/**
 * Configuration of `createCmcdSession()`. Every member is optional.
 * `version`, `transmissionMode`, `keys`, `headerMap`, and `transform` apply to request mode.
 *
 * @public
 */
export type CmcdSessionConfig = {
	/** Default: a new UUID. */
	readonly sid?: string
	/** Default `CMCD_V2`. */
	readonly version?: CmcdVersion
	/** `CMCD_QUERY` or `CMCD_HEADERS`. Default `CMCD_QUERY`. */
	readonly transmissionMode?: CmcdTransmissionMode
	/** Request-mode key allowlist. Default: every key of the version. */
	readonly keys?: readonly CmcdKey[]
	/** Header shard per custom key. */
	readonly headerMap?: Partial<CmcdHeaderMap>
	readonly transform?: CmcdRequestTransform
	readonly eventTargets?: readonly CmcdEventTargetConfig[]
	/** Sends the event-mode POST requests. Default: `fetch` with `keepalive`. */
	readonly requester?: CmcdRequester
	/** Observations the reporter turns into defaults. Each is on by default. */
	readonly derive?: Partial<Record<'bg' | 'dl' | 'su', boolean>>
	/** Receives errors that have no caller: interval reports and a requester that fails after the back-off cap. */
	readonly onError?: (error: unknown) => void
}
