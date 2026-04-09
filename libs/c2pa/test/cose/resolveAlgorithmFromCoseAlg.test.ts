import { resolveAlgorithmFromCoseAlg } from '../../src/cose/resolveAlgorithmFromCoseAlg.ts'
import { deepStrictEqual, throws } from 'node:assert'
import { describe, it } from 'node:test'

describe('resolveAlgorithmFromCoseAlg', () => {
	// #region example
	it('maps ES256 (-7) to ECDSA P-256', () => {
		deepStrictEqual(resolveAlgorithmFromCoseAlg(-7), { name: 'ECDSA', namedCurve: 'P-256' })
	})
	// #endregion example

	it('maps ES384 (-35) to ECDSA P-384', () => {
		deepStrictEqual(resolveAlgorithmFromCoseAlg(-35), { name: 'ECDSA', namedCurve: 'P-384' })
	})

	it('maps ES512 (-36) to ECDSA P-521', () => {
		deepStrictEqual(resolveAlgorithmFromCoseAlg(-36), { name: 'ECDSA', namedCurve: 'P-521' })
	})

	it('maps EdDSA (-8) to Ed25519', () => {
		deepStrictEqual(resolveAlgorithmFromCoseAlg(-8), { name: 'Ed25519' })
	})

	it('maps PS256 (-37) to RSA-PSS SHA-256', () => {
		deepStrictEqual(resolveAlgorithmFromCoseAlg(-37), { name: 'RSA-PSS', hash: { name: 'SHA-256' } })
	})

	it('maps PS384 (-38) to RSA-PSS SHA-384', () => {
		deepStrictEqual(resolveAlgorithmFromCoseAlg(-38), { name: 'RSA-PSS', hash: { name: 'SHA-384' } })
	})

	it('maps PS512 (-39) to RSA-PSS SHA-512', () => {
		deepStrictEqual(resolveAlgorithmFromCoseAlg(-39), { name: 'RSA-PSS', hash: { name: 'SHA-512' } })
	})

	it('maps PS256 (-37) to RSA-PSS SHA-256', () => {
		deepStrictEqual(resolveAlgorithmFromCoseAlg(-37), { name: 'RSA-PSS', hash: { name: 'SHA-256' } })
	})

	it('maps PS384 (-38) to RSA-PSS SHA-384', () => {
		deepStrictEqual(resolveAlgorithmFromCoseAlg(-38), { name: 'RSA-PSS', hash: { name: 'SHA-384' } })
	})

	it('maps PS512 (-39) to RSA-PSS SHA-512', () => {
		deepStrictEqual(resolveAlgorithmFromCoseAlg(-39), { name: 'RSA-PSS', hash: { name: 'SHA-512' } })
	})

	it('throws for unsupported algorithm', () => {
		throws(() => resolveAlgorithmFromCoseAlg(999), /Unsupported COSE algorithm/)
	})
})
