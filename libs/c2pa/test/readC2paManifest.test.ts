import { readC2paManifest } from '../src/readC2paManifest.ts'
import type { C2paAssertion } from '@svta/cml-c2pa'
import { ok, doesNotThrow, throws } from 'node:assert'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

function loadFixture(name: string): Uint8Array {
	return new Uint8Array(readFileSync(new URL(`./fixtures/${name}`, import.meta.url)))
}

describe('readC2paManifest', () => {
	// #region example
	it('parses a C2PA manifest from an init segment', () => {
		const bytes = loadFixture('init_signed_with_session_keys.m4s')
		const manifestStore = readC2paManifest(bytes)

		ok(manifestStore.activeManifest, 'activeManifest should be present')
		ok(typeof manifestStore.activeManifest.label === 'string', 'label should be a string')
	})
	// #endregion example

	it('returns assertions array', () => {
		const bytes = loadFixture('init_signed_with_session_keys.m4s')
		const { activeManifest } = readC2paManifest(bytes)

		ok(Array.isArray(activeManifest.assertions), 'assertions should be an array')
	})

	it('returns signatureInfo with issuer', () => {
		const bytes = loadFixture('init_signed_with_session_keys.m4s')
		const { activeManifest } = readC2paManifest(bytes)

		ok(
			typeof activeManifest.signatureInfo.issuer === 'string' || activeManifest.signatureInfo.issuer === null,
			'issuer should be string or null',
		)
	})

	it('parses a media segment with c2pa.livevideo.segment assertion', () => {
		const bytes = loadFixture('test-segment.m4s')

		doesNotThrow(() => readC2paManifest(bytes))

		const { activeManifest } = readC2paManifest(bytes)
		const liveVideoAssertion = activeManifest.assertions.find((a: C2paAssertion) => a.label === 'c2pa.livevideo.segment')

		ok(liveVideoAssertion !== undefined, 'c2pa.livevideo.segment assertion should be present')
	})

	it('throws when no C2PA UUID box is present', () => {
		const emptyMp4 = new Uint8Array([
			0x00, 0x00, 0x00, 0x08, 0x66, 0x74, 0x79, 0x70, // ftyp box, 8 bytes
		])

		throws(
			() => readC2paManifest(emptyMp4),
			/No C2PA UUID box/,
		)
	})

	it('returns instanceId when present in the claim', () => {
		const bytes = loadFixture('init_signed_with_session_keys.m4s')
		const { activeManifest } = readC2paManifest(bytes)

		ok(
			typeof activeManifest.instanceId === 'string' || activeManifest.instanceId === null,
			'instanceId should be string or null',
		)
	})

})
