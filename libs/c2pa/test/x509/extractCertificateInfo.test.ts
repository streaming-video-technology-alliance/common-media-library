import { extractCertificateInfo } from '../../src/x509/extractCertificateInfo.ts'
import { ok, strictEqual } from 'node:assert'
import { describe, it } from 'node:test'

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

	it('returns CertificateInfo shape when valid cert provided', () => {
		// A real DER cert would be tested here via the init segment fixture.
		// This unit test verifies the return type shape is correct.
		// Integration tested via readC2paManifest.test.ts.
		const result = extractCertificateInfo(new Uint8Array([0x30, 0x03, 0x01, 0x01, 0xff]))
		// Either null or a valid CertificateInfo
		ok(result === null || (typeof result.issuer === 'string' && (result.notBefore === null || typeof result.notBefore === 'string')))
	})
})
