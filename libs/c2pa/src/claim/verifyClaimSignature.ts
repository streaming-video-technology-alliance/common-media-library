import { decodeCoseSign1 } from '../cose/decodeCoseSign1.ts'
import { resolveAlgorithmFromCoseAlg } from '../cose/resolveAlgorithmFromCoseAlg.ts'
import { verifyCoseSign1 } from '../cose/verifyCoseSign1.ts'
import { extractCertificateSpki } from '../x509/extractCertificateSpki.ts'
import { normalizeRsaPssSpki } from '../x509/normalizeRsaPssSpki.ts'

/**
 * Verifies the claim signature of a C2PA manifest per §15.7.
 *
 * The `c2pa.signature` JUMBF box contains a `COSE_Sign1` structure whose payload
 * is the claim CBOR bytes. This function verifies the signature against the
 * public key extracted from the end-entity certificate in the `x5chain` header.
 *
 * @param signatureBytes - Raw COSE_Sign1 bytes from the `c2pa.signature` box
 * @param claimCborBytes - Raw CBOR bytes of the claim content box
 * @param certificateDER - DER-encoded end-entity X.509 certificate
 * @returns `true` if the signature is valid
 *
 * @internal
 */
export async function verifyClaimSignature(
	signatureBytes: Uint8Array,
	claimCborBytes: Uint8Array,
	certificateDER: Uint8Array,
): Promise<boolean> {
	try {
		const coseSign1 = decodeCoseSign1(signatureBytes)

		const rawSpki = extractCertificateSpki(certificateDER)
		if (!rawSpki) return false
		const spkiBytes = normalizeRsaPssSpki(rawSpki)

		if (coseSign1.alg == null) return false

		const importAlgorithm = resolveAlgorithmFromCoseAlg(coseSign1.alg)

		const publicKey = await crypto.subtle.importKey(
			'spki',
			new Uint8Array(spkiBytes) as BufferSource,
			importAlgorithm,
			true,
			['verify'],
		)

		return verifyCoseSign1(coseSign1, claimCborBytes, publicKey)
	}
	catch {
		return false
	}
}
