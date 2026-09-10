import { checkEvents, checkKeys, checkRequestSettings, checkSid, configError } from './checkRequestSettings.ts'
import { CMCD_DEFAULT_TIME_INTERVAL } from './CMCD_DEFAULT_TIME_INTERVAL.ts'
import { CMCD_V2 } from './CMCD_V2.ts'
import type { CmcdEventTargetConfig } from './CmcdEventTargetConfig.ts'
import type { CmcdSessionConfig } from './CmcdSessionConfig.ts'
import { CMCD_QUERY } from './CmcdTransmissionMode.ts'
import { defaultRequester } from './defaultRequester.ts'
import type { NormalizedEventTarget } from './NormalizedEventTarget.ts'
import type { NormalizedSessionConfig } from './NormalizedSessionConfig.ts'

const DEFAULT_EVENTS = ['ps', 'e', 't', 'rr']

function isPositiveInteger(value: unknown): value is number {
	return typeof value === 'number' && Number.isInteger(value) && value > 0
}

function normalizeTarget(target: CmcdEventTargetConfig, index: number): NormalizedEventTarget {
	const name = `eventTargets[${index}]`
	if (typeof target.url !== 'string' || target.url === '') {
		throw configError(`${name}.url`, 'a non-empty string', target.url)
	}
	if ('version' in target) {
		throw configError(`${name}.version`, 'absent, event mode is version 2', (target as { version?: unknown }).version)
	}
	if (target.events !== undefined) {
		checkEvents(`${name}.events`, target.events)
	}
	if (target.keys !== undefined) {
		checkKeys(`${name}.keys`, target.keys)
	}
	const interval = target.interval ?? CMCD_DEFAULT_TIME_INTERVAL
	if (typeof interval !== 'number' || !Number.isFinite(interval) || interval < 0) {
		throw configError(`${name}.interval`, 'a finite number of seconds, 0 or more', target.interval)
	}
	const maxQueueSize = target.maxQueueSize ?? 500
	if (!isPositiveInteger(maxQueueSize)) {
		throw configError(`${name}.maxQueueSize`, 'a positive integer', target.maxQueueSize)
	}
	const batchSize = target.batchSize ?? 1
	if (!isPositiveInteger(batchSize)) {
		throw configError(`${name}.batchSize`, 'a positive integer', target.batchSize)
	}
	if (batchSize > maxQueueSize) {
		throw configError(`${name}.batchSize`, `at most maxQueueSize (${maxQueueSize})`, batchSize)
	}
	return {
		url: target.url,
		events: new Set(target.events ?? DEFAULT_EVENTS),
		keys: target.keys === undefined ? undefined : new Set(target.keys),
		interval: interval * 1000,
		batchSize,
		maxQueueSize,
		headers: target.headers === undefined ? undefined : { ...target.headers },
		transform: target.transform,
	}
}

/** Applies the defaults and throws on the first invalid setting. */
export function normalizeSessionConfig(config: CmcdSessionConfig): NormalizedSessionConfig {
	if (config.sid !== undefined) {
		checkSid(config.sid)
	}
	checkRequestSettings(config)
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
