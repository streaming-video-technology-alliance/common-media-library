import type { SteeringManifest } from './SteeringManifest.ts'
import { uniqueStrings } from './uniqueStrings.ts'

/**
 * The result of `parseSteeringManifest`.
 *
 * @internal
 */
export type ParsedSteeringManifest =
	| {
		readonly manifest: SteeringManifest;
		readonly priority: readonly string[];
		readonly clones: readonly unknown[];
		readonly reloadUri: string | undefined;
	}
	| {
		readonly error: string;
		readonly version: boolean;
		readonly cause?: unknown;
	};

/**
 * Parses and checks the body of a Steering Manifest response.
 *
 * The Steering Manifest is valid when VERSION is 1, TTL is a positive
 * number, PATHWAY-PRIORITY has at least one string, and a relative
 * RELOAD-URI resolves. PATHWAY-PRIORITY keeps the first of each string.
 * An absent or empty PATHWAY-CLONES array means no clones.
 *
 * @param data - The response body, as a string or as a parsed JSON value.
 * @param uri - The URI of the response. A relative RELOAD-URI resolves against it.
 * @returns The Steering Manifest, its priority list, its clones, and its
 * resolved RELOAD-URI, or an error. `version` is `true` when the error is a
 * VERSION other than 1.
 *
 * @internal
 */
export function parseSteeringManifest(data: unknown, uri: string): ParsedSteeringManifest {
	let value = data

	if (typeof data === 'string') {
		try {
			value = JSON.parse(data)
		} catch (cause) {
			return { error: `The Steering Manifest from ${uri} is not valid JSON.`, version: false, cause }
		}
	}

	if (!isPlainObject(value)) {
		return { error: `The Steering Manifest from ${uri} is not a JSON object.`, version: false }
	}

	const manifest = value as SteeringManifest

	if (manifest.VERSION !== 1) {
		return { error: `The Steering Manifest from ${uri} has VERSION ${String(manifest.VERSION)}. Only VERSION 1 is supported.`, version: true }
	}

	if (typeof manifest.TTL !== 'number' || !Number.isFinite(manifest.TTL) || manifest.TTL <= 0) {
		return { error: `The Steering Manifest from ${uri} has no positive TTL.`, version: false }
	}

	const list: unknown = manifest['PATHWAY-PRIORITY']
	const priority = Array.isArray(list) ? uniqueStrings(list) : []

	if (priority.length === 0) {
		return { error: `The Steering Manifest from ${uri} has no pathway in PATHWAY-PRIORITY.`, version: false }
	}

	const cloneList: unknown = manifest['PATHWAY-CLONES']
	const clones: readonly unknown[] = Array.isArray(cloneList) ? cloneList : []
	const reload: unknown = manifest['RELOAD-URI']

	if (reload === undefined) {
		return { manifest, priority, clones, reloadUri: undefined }
	}

	try {
		if (typeof reload !== 'string') {
			throw new TypeError('RELOAD-URI is not a string')
		}

		return { manifest, priority, clones, reloadUri: new URL(reload, uri).href }
	} catch (cause) {
		return { error: `The RELOAD-URI ${JSON.stringify(reload)} of the Steering Manifest from ${uri} does not resolve.`, version: false, cause }
	}
}

function isPlainObject(value: unknown): boolean {
	if (typeof value !== 'object' || value === null) {
		return false
	}

	const proto: unknown = Object.getPrototypeOf(value)

	return proto === Object.prototype || proto === null
}
