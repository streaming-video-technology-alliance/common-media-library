import { equal } from 'node:assert'
import { describe, it } from 'node:test'
import { percentEncode } from '../src/percentEncode.ts'

describe('percentEncode', () => {
	it('keeps only letters, digits, and -._~ unencoded', () => {
		equal(percentEncode('Az09-._~'), 'Az09-._~')
		equal(percentEncode(' !"\'()*+,/:;=?@'), '%20%21%22%27%28%29%2A%2B%2C%2F%3A%3B%3D%3F%40')
	})

	it('encodes a character outside ASCII as UTF-8', () => {
		equal(percentEncode('é😀'), '%C3%A9%F0%9F%98%80')
	})

	it('encodes an unpaired surrogate as U+FFFD', () => {
		equal(percentEncode('a\uD800b\uDC00'), 'a%EF%BF%BDb%EF%BF%BD')
	})
})
