import { uuid } from '@svta/cml-utils'
import { equal } from 'node:assert'
import { describe, it } from 'node:test'

describe('UUID generation', () => {
	const regex = /^[A-F\d]{8}-[A-F\d]{4}-4[A-F\d]{3}-[89AB][A-F\d]{3}-[A-F\d]{12}$/i
	const id = uuid()

	it('provides a valid example', () => {
		//#region example
		const id = uuid()
		equal(id.length, 36)
		//#endregion example
	})

	it('is formatted correctly', () => {
		equal(regex.test(id), true)
	})

	it('produces unique IDs', () => {
		equal(uuid() == id, false)
	})

	it('generates a v4 UUID when crypto.randomUUID is unavailable', () => {
		Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true })
		try {
			const fallback = uuid()
			equal(regex.test(fallback), true)
			equal(fallback === uuid(), false)
		}
		finally {
			Reflect.deleteProperty(crypto, 'randomUUID')
		}
	})
})
