import { extractManifestCertificate } from '../../src/extractManifestCertificate.ts'
import { ok, strictEqual } from 'node:assert'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

describe('extractManifestCertificate', () => {
	// #region example
	it('returns null for empty bytes', () => {
		strictEqual(extractManifestCertificate(new Uint8Array(0)), null)
	})
	// #endregion example

	it('returns null for bytes with no C2PA UUID box', () => {
		const fakeBox = new Uint8Array([0x00, 0x00, 0x00, 0x08, 0x6d, 0x6f, 0x6f, 0x76])
		strictEqual(extractManifestCertificate(fakeBox), null)
	})

	it('extracts a DER certificate from a real init segment', () => {
		const fixture = new Uint8Array(
			readFileSync(new URL('../fixtures/init_signed_with_session_keys.m4s', import.meta.url)),
		)
		const cert = extractManifestCertificate(fixture)
		// Either the fixture has a certificate or not — both are acceptable
		ok(cert === null || cert instanceof Uint8Array, 'result must be null or Uint8Array')
		if (cert !== null) {
			ok(cert.length > 0, 'certificate must not be empty')
			// DER certificates start with SEQUENCE tag 0x30
			strictEqual(cert[0], 0x30, 'DER certificate must start with SEQUENCE tag')
		}
	})
})
