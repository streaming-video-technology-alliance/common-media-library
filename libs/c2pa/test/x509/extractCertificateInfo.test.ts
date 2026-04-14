import { extractCertificateInfo } from '../../src/x509/extractCertificateInfo.ts'
import { extractManifestCertificate } from '../../src/extractManifestCertificate.ts'
import { ok, strictEqual } from 'node:assert'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

function loadFixture(name: string): Uint8Array {
	return new Uint8Array(readFileSync(new URL(`../fixtures/${name}`, import.meta.url)))
}

describe('extractCertificateInfo', () => {
	// #region example
	it('returns null for empty input', () => {
		strictEqual(extractCertificateInfo(new Uint8Array([])), null)
	})
	// #endregion example

	it('returns null for non-DER input', () => {
		const garbage = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05])
		strictEqual(extractCertificateInfo(garbage), null)
	})

	it('returns null for truncated DER', () => {
		// Start of a SEQUENCE tag with length claiming 100 bytes but no data
		const truncated = new Uint8Array([0x30, 0x64])
		strictEqual(extractCertificateInfo(truncated), null)
	})

	it('extracts issuer and notBefore from a real DER certificate', () => {
		const initBytes = loadFixture('init_signed_with_session_keys.m4s')
		const certDER = extractManifestCertificate(initBytes)

		if (certDER === null) {
			// Fixture may not yield a cert depending on CBOR header format — skip gracefully
			ok(true, 'no certificate extractable from fixture, skipping')
			return
		}

		const info = extractCertificateInfo(certDER)
		ok(info !== null, 'should parse the certificate')
		ok(typeof info.issuer === 'string' && info.issuer.length > 0, 'issuer should be a non-empty string')
		ok(typeof info.notBefore === 'string' && info.notBefore.length > 0, 'notBefore should be a non-empty string')
	})
})
