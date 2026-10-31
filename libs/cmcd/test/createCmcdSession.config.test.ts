import type { CmcdSessionConfig } from '@svta/cml-cmcd'
import { CmcdTransmissionMode, createCmcdSession } from '@svta/cml-cmcd'
import { doesNotThrow, throws } from 'node:assert'
import { describe, it } from 'vite-plus/test'

const target = { url: 'https://collector.test/cmcd', events: [] }
const send = () => Promise.resolve()

describe('createCmcdSession configuration checks', () => {
	it('provides a valid example', () => {
		// #region example
		throws(
			() =>
				createCmcdSession({
					eventTargets: [{ url: 'https://collector.example.com/cmcd', events: [], batchSize: 0 }],
				}),
			{
				message:
					'createCmcdSession: eventTargets[0].batchSize must be a positive integer, received 0',
			},
		)
		// #endregion example
	})

	it('throws for an invalid sid, cid, url, send, interval, or batchSize', () => {
		const cases: [CmcdSessionConfig, string][] = [
			[{ sid: '' }, 'createCmcdSession: sid must be a string of 1 to 64 characters, received ""'],
			[
				{ sid: 'x'.repeat(65) },
				`createCmcdSession: sid must be a string of 1 to 64 characters, received "${'x'.repeat(65)}"`,
			],
			[
				{ sid: 5 as unknown as string },
				'createCmcdSession: sid must be a string of 1 to 64 characters, received 5',
			],
			[
				{ cid: 'x'.repeat(129) },
				`createCmcdSession: cid must be a string of at most 128 characters, received "${'x'.repeat(129)}"`,
			],
			[
				{ eventTargets: [{ ...target, url: '' }] },
				'createCmcdSession: eventTargets[0].url must be a non-empty string, received ""',
			],
			[
				{ eventTargets: [{ events: [] } as unknown as typeof target] },
				'createCmcdSession: eventTargets[0].url must be a non-empty string, received undefined',
			],
			[
				{ eventTargets: [{ send: 5, events: [] } as unknown as typeof target] },
				'createCmcdSession: eventTargets[0].send must be a function, received 5',
			],
			[
				{ eventTargets: [{ ...target, send } as unknown as typeof target] },
				'createCmcdSession: eventTargets[0].url must be undefined when send is set, received "https://collector.test/cmcd"',
			],
			[
				{ eventTargets: [{ ...target, interval: -1 }] },
				'createCmcdSession: eventTargets[0].interval must be a finite number, 0 or more, received -1',
			],
			[
				{ eventTargets: [{ ...target, interval: Infinity }] },
				'createCmcdSession: eventTargets[0].interval must be a finite number, 0 or more, received Infinity',
			],
			[
				{ eventTargets: [target, { ...target, batchSize: 0 }] },
				'createCmcdSession: eventTargets[1].batchSize must be a positive integer, received 0',
			],
			[
				{ eventTargets: [{ ...target, batchSize: 1.5 }] },
				'createCmcdSession: eventTargets[0].batchSize must be a positive integer, received 1.5',
			],
		]

		for (const [config, message] of cases) {
			throws(() => createCmcdSession(config), { message })
		}
	})

	it('accepts the limits of each rule', () => {
		const configs: CmcdSessionConfig[] = [
			{},
			{
				sid: 'x'.repeat(64),
				cid: 'x'.repeat(128),
				version: 1,
				transmissionMode: CmcdTransmissionMode.HEADERS,
			},
			{ cid: '' },
			{ eventTargets: [{ ...target, interval: 0, batchSize: 1 }] },
			{ eventTargets: [{ send, events: [] }] },
		]

		for (const config of configs) {
			doesNotThrow(() => createCmcdSession(config))
		}
	})
})
