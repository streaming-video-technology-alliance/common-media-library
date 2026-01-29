import { appendCmcdHeaders } from '@svta/cml-cmcd'
import { deepEqual } from 'node:assert'
import { describe, it } from 'node:test'

describe('appendCmcdHeaders', () => {
	const headers = {
		hello: 'world',
	}

	const data = {
		br: 1000,
	}

	it('provides a valid example', () => {
		//#region example
		const headers = {
			hello: 'world',
		}

		const data = {
			br: 1000,
		}

		deepEqual(appendCmcdHeaders(headers, data), {
			hello: 'world',
			['CMCD-Object']: 'br=1000',
			['CMCD-Session']: 'v=2',
		})
		//#endregion example
	})

	it('handles null data object', () => {
		deepEqual(appendCmcdHeaders(headers, null as any), headers)
	})

	it('appends headers', () => {
		deepEqual(appendCmcdHeaders(headers, data), {
			...headers,
			['CMCD-Object']: 'br=1000',
			['CMCD-Session']: 'v=2',
		})
	})
})
