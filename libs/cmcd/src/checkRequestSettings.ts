import { CMCD_KEY_SPECS } from './CMCD_KEY_SPECS.ts'
import type { CmcdSessionConfig } from './CmcdSessionConfig.ts'
import { CMCD_HEADERS, CMCD_QUERY } from './CmcdTransmissionMode.ts'
import { getKeySpec } from './getKeySpec.ts'

/** The error every configuration check throws. */
export function configError(parameter: string, expected: string, received: unknown): Error {
	return new Error(`CmcdSession: ${parameter} must be ${expected}, received ${String(received)}`)
}

/** Checks that `sid` is a non-empty string of at most 64 characters. */
export function checkSid(sid: unknown): void {
	if (typeof sid !== 'string' || sid === '' || sid.length > 64) {
		throw configError('sid', 'a string of at most 64 characters', sid)
	}
}

/** Checks that `cid` is a string of at most 128 characters. */
export function checkCid(cid: unknown): void {
	if (typeof cid !== 'string' || cid.length > 128) {
		throw configError('cid', 'a string of at most 128 characters', cid)
	}
}

/** Checks that every key of `keys` is a reserved key or a hyphenated custom key. */
export function checkKeys(parameter: string, keys: readonly string[]): void {
	for (const key of keys) {
		if (getKeySpec(key) === undefined) {
			throw configError(parameter, 'reserved keys or hyphenated custom keys', key)
		}
	}
}

/** Checks that every event of `events` is a reserved event type. */
export function checkEvents(parameter: string, events: readonly string[]): void {
	const tokens = CMCD_KEY_SPECS['e'].tokens ?? []
	for (const event of events) {
		if (!tokens.includes(event)) {
			throw configError(parameter, 'event types', event)
		}
	}
}

/** The request-mode settings that `createCmcdSession()` and `configure()` share. */
export function checkRequestSettings(settings: Pick<CmcdSessionConfig, 'version' | 'transmissionMode' | 'keys' | 'headerMap'>): void {
	if (settings.version !== undefined && settings.version !== 1 && settings.version !== 2) {
		throw configError('version', '1 or 2', settings.version)
	}
	if (settings.transmissionMode !== undefined && settings.transmissionMode !== CMCD_QUERY && settings.transmissionMode !== CMCD_HEADERS) {
		throw configError('transmissionMode', 'query or headers', settings.transmissionMode)
	}
	if (settings.keys !== undefined) {
		checkKeys('keys', settings.keys)
	}
	if (settings.headerMap !== undefined) {
		for (const keys of Object.values(settings.headerMap)) {
			checkKeys('headerMap', keys ?? [])
		}
	}
}
