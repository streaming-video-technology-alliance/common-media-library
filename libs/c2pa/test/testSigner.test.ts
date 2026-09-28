import { deepStrictEqual, strictEqual } from 'node:assert'
import { X509Certificate } from 'node:crypto'
import { before, describe, it } from 'node:test'
import { verifyClaimSignature } from '../src/claim/verifyClaimSignature.ts'
import { decodeCoseSign1 } from '../src/cose/decodeCoseSign1.ts'
import { extractCertificateFromSignatureBytes } from '../src/extractManifestCertificate.ts'
import { extractCertificateInfo } from '../src/x509/extractCertificateInfo.ts'
import { createTestSigner, type TestSigner } from './testSigner.ts'

describe('createTestSigner', () => {
	const claim = new Uint8Array([0xa1, 0x61, 0x61, 0x01]) // {"a": 1}
	let signer: TestSigner

	before(async () => {
		signer = await createTestSigner()
	})

	it('produces a claim signature that verifyClaimSignature accepts', async () => {
		const cose = await signer.sign(claim)

		strictEqual(await verifyClaimSignature(cose, claim, signer.certificateDER), true)
	})

	it('produces a claim signature that does not verify over other claim bytes', async () => {
		const cose = await signer.sign(claim)
		const otherClaim = new Uint8Array([0xa1, 0x61, 0x61, 0x02])

		strictEqual(await verifyClaimSignature(cose, otherClaim, signer.certificateDER), false)
	})

	it('embeds the certificate as the x5chain of a tagged COSE_Sign1 with a detached payload', async () => {
		const cose = await signer.sign(claim)

		strictEqual(cose[0], 0xd2)
		strictEqual(decodeCoseSign1(cose).payload, null)
		deepStrictEqual(extractCertificateFromSignatureBytes(cose), signer.certificateDER)
	})

	it('builds a self-signed certificate that names the test issuer', () => {
		const certificate = new X509Certificate(signer.certificateDER)

		strictEqual(certificate.verify(certificate.publicKey), true)
		strictEqual(certificate.issuer, 'CN=CML Test Signer')
		strictEqual(extractCertificateInfo(signer.certificateDER)?.issuer, 'CML Test Signer')
	})
})
