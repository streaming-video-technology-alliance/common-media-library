import { extractCertificateSpki } from '../../src/x509/extractCertificateSpki.ts'
import { extractManifestCertificate } from '../../src/extractManifestCertificate.ts'
import { ok, strictEqual } from 'node:assert'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

function loadFixture(name: string): Uint8Array {
	return new Uint8Array(readFileSync(new URL(`../fixtures/${name}`, import.meta.url)))
}

describe('extractCertificateSpki', () => {
	// #region example
	it('extracts SPKI bytes from a real certificate', () => {
		const initBytes = loadFixture('init_signed_with_session_keys.m4s')
		const certDER = extractManifestCertificate(initBytes)
		ok(certDER, 'certificate should be extractable from fixture')

		const spki = extractCertificateSpki(certDER)
		ok(spki, 'SPKI should be extractable')
		ok(spki.length > 0, 'SPKI should have content')
		// SPKI starts with SEQUENCE tag (0x30)
		strictEqual(spki[0], 0x30, 'SPKI should start with SEQUENCE tag')
	})
	// #endregion example

	it('returns null for empty input', () => {
		strictEqual(extractCertificateSpki(new Uint8Array(0)), null)
	})

	it('returns null for non-DER input', () => {
		strictEqual(extractCertificateSpki(new Uint8Array([0x01, 0x02, 0x03])), null)
	})

	it('returns null for truncated DER', () => {
		strictEqual(extractCertificateSpki(new Uint8Array([0x30, 0x82, 0x01])), null)
	})

	it('extracts SPKI that can be imported as a CryptoKey', async () => {
		const initBytes = loadFixture('init_signed_with_session_keys.m4s')
		const certDER = extractManifestCertificate(initBytes)
		ok(certDER, 'certificate should be extractable')

		const spki = extractCertificateSpki(certDER)
		ok(spki, 'SPKI should be extractable')

		// Try importing as ECDSA P-256 (common C2PA signing key type)
		// If this is not the right algorithm, try Ed25519
		let imported = false
		for (const algorithm of [
			{ name: 'ECDSA', namedCurve: 'P-256' },
			{ name: 'ECDSA', namedCurve: 'P-384' },
			{ name: 'Ed25519' },
		] as (AlgorithmIdentifier | EcKeyImportParams)[]) {
			try {
				const key = await crypto.subtle.importKey('spki', spki, algorithm, true, ['verify'])
				ok(key, 'key should be importable')
				imported = true
				break
			} catch {
				// try next algorithm
			}
		}
		strictEqual(imported, true, 'SPKI should be importable with at least one supported algorithm')
	})
})
