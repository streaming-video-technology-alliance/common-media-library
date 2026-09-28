import type { DeepReadonly } from '@svta/cml-utils'
import { ok } from 'node:assert'
import { describe, it } from 'node:test'

describe('DeepReadonly', () => {
	it('provides a valid example', () => {
		//#region example
		type PlayerData = {
			requestType: string;
			timing: { start: number; };
		};

		const data: DeepReadonly<PlayerData> = {
			requestType: 'segment',
			timing: { start: 0 },
		}

		// Reading at any depth is unchanged.
		ok(data.requestType === 'segment')
		ok(data.timing.start === 0)

		// @ts-expect-error - top-level properties are readonly
		data.requestType = 'manifest'

		// @ts-expect-error - nested properties are readonly too
		data.timing.start = 1
		//#endregion example
	})

	it('makes arrays readonly at every depth', () => {
		type WithList = { tags: { name: string; }[]; };

		const data: DeepReadonly<WithList> = { tags: [{ name: 'a' }] }

		ok(data.tags[0].name === 'a')

		// @ts-expect-error - the array itself is readonly
		data.tags.push({ name: 'b' })

		// @ts-expect-error - the array's elements are readonly
		data.tags[0].name = 'b'
	})

	it('leaves functions callable', () => {
		type WithFn = { onDone: (n: number) => number; };

		const data: DeepReadonly<WithFn> = { onDone: n => n + 1 }

		ok(data.onDone(1) === 2)
	})

	it('leaves primitives and index signatures alone', () => {
		const primitive: DeepReadonly<string> = 'a'
		ok(primitive === 'a')

		// The opaque-record case: values stay `unknown`, so reads go through
		// bracket access exactly as an un-narrowed record would.
		const record: DeepReadonly<Record<string, unknown>> = { anything: 1 }
		ok(record['anything'] === 1)

		// @ts-expect-error - index-signature entries are readonly
		record['anything'] = 2
	})
})
