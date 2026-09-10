import type { CmcdEventTransform } from './CmcdEventTransform.ts'
import type { CmcdEventType } from './CmcdEventType.ts'
import type { CmcdKey } from './CmcdKey.ts'

/**
 * One event-mode destination. `{ url }` is a complete configuration.
 *
 * @public
 */
export type CmcdEventTargetConfig = {
	readonly url: string
	/** Default `['ps', 'e', 't', 'rr']`. */
	readonly events?: readonly CmcdEventType[]
	/** Key allowlist. Default: every event key. */
	readonly keys?: readonly CmcdKey[]
	/** Seconds between `t` reports. Default 30. `0` disables them. */
	readonly interval?: number
	/** Lines per POST. Default 1. */
	readonly batchSize?: number
	/** Queued lines kept while the destination is unreachable. Default 500. */
	readonly maxQueueSize?: number
	/** Headers sent with every POST. */
	readonly headers?: Readonly<Record<string, string>>
	readonly transform?: CmcdEventTransform
}
