import { CMCD_DEFAULT_TIME_INTERVAL } from './CMCD_DEFAULT_TIME_INTERVAL.ts'
import { CMCD_V2 } from './CMCD_V2.ts'
import type { CmcdEventTargetConfig } from './CmcdEventTargetConfig.ts'
import type { CmcdSessionConfig } from './CmcdSessionConfig.ts'
import { CMCD_QUERY } from './CmcdTransmissionMode.ts'
import { defaultRequester } from './defaultRequester.ts'
import type { NormalizedEventTarget } from './NormalizedEventTarget.ts'
import type { NormalizedSessionConfig } from './NormalizedSessionConfig.ts'

const DEFAULT_EVENTS = ['ps', 'e', 't', 'rr']

function normalizeTarget(target: CmcdEventTargetConfig): NormalizedEventTarget {
	return {
		url: target.url,
		events: new Set(target.events ?? DEFAULT_EVENTS),
		keys: target.keys === undefined ? undefined : new Set(target.keys),
		interval: (target.interval ?? CMCD_DEFAULT_TIME_INTERVAL) * 1000,
		batchSize: target.batchSize ?? 1,
		maxQueueSize: target.maxQueueSize ?? 500,
		headers: target.headers === undefined ? undefined : { ...target.headers },
		transform: target.transform,
	}
}

/** Applies the defaults. Task 3 adds the checks. */
export function normalizeSessionConfig(config: CmcdSessionConfig): NormalizedSessionConfig {
	return {
		version: config.version ?? CMCD_V2,
		transmissionMode: config.transmissionMode ?? CMCD_QUERY,
		keys: config.keys === undefined ? undefined : new Set(config.keys),
		headerMap: config.headerMap,
		transform: config.transform,
		eventTargets: (config.eventTargets ?? []).map(normalizeTarget),
		requester: config.requester ?? defaultRequester,
		derive: { bg: config.derive?.bg ?? true, dl: config.derive?.dl ?? true, su: config.derive?.su ?? true },
		onError: config.onError,
	}
}
