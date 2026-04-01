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

	it('throws for unsupported algorithm', () => {
		throws(() => resolveAlgorithmFromCoseAlg(999), /Unsupported COSE algorithm/)
	})
})
