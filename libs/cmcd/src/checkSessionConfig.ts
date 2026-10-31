import type { CmcdSessionConfig } from './CmcdSessionConfig.ts'

function configError(parameter: string, expected: string, received: unknown): Error {
	const value = typeof received === 'string' ? JSON.stringify(received) : String(received)

	return new Error(`createCmcdSession: ${parameter} must be ${expected}, received ${value}`)
}

/**
 * Checks the rules of a session configuration that the TypeScript types cannot express.
 *
 * @param config - The configuration to check.
 *
 * @throws If `sid`, `cid`, or the `url`, `send`, `interval`, or `batchSize` of a target is invalid.
 * A target has a `url` or a `send` function, not both.
 *
 * @internal
 */
export function checkSessionConfig(config: CmcdSessionConfig): void {
	const { sid, cid, eventTargets } = config

	if (sid !== undefined && (typeof sid !== 'string' || sid === '' || sid.length > 64)) {
		throw configError('sid', 'a string of 1 to 64 characters', sid)
	}

	if (cid !== undefined && (typeof cid !== 'string' || cid.length > 128)) {
		throw configError('cid', 'a string of at most 128 characters', cid)
	}

	eventTargets?.forEach(({ url, send, interval, batchSize }, i) => {
		if (send !== undefined) {
			if (typeof send !== 'function') {
				throw configError(`eventTargets[${i}].send`, 'a function', send)
			}

			if (url !== undefined) {
				throw configError(`eventTargets[${i}].url`, 'undefined when send is set', url)
			}
		} else if (typeof url !== 'string' || url === '') {
			throw configError(`eventTargets[${i}].url`, 'a non-empty string', url)
		}

		if (interval !== undefined && !(Number.isFinite(interval) && interval >= 0)) {
			throw configError(`eventTargets[${i}].interval`, 'a finite number, 0 or more', interval)
		}

		if (batchSize !== undefined && !(Number.isInteger(batchSize) && batchSize > 0)) {
			throw configError(`eventTargets[${i}].batchSize`, 'a positive integer', batchSize)
		}
	})
}
