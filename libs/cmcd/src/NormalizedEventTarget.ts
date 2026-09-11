import type { CmcdEventTransform } from './CmcdEventTransform.ts'

/** An event target with every default applied. `interval` is in milliseconds. */
export type NormalizedEventTarget = {
	readonly url: string
	readonly events: ReadonlySet<string>
	readonly keys: ReadonlySet<string> | undefined
	readonly interval: number
	readonly batchSize: number
	readonly maxQueueSize: number
	readonly headers: Readonly<Record<string, string>> | undefined
	readonly transform: CmcdEventTransform | undefined
}
