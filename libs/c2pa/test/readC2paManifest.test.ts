import { readC2paManifest } from '../src/readC2paManifest.ts'
import type { C2paAssertion } from '@svta/cml-c2pa'
import { deepStrictEqual, doesNotThrow, ok, strictEqual, throws } from 'node:assert'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { CborTag } from '../src/cbor/readCborItem.ts'
import { buildBox, buildJumb } from './merkle/merkleTestUtils.ts'
import { buildInitSegmentWithManifest } from './vsi/vsiTestUtils.ts'

const TEXT_ENCODER = new TextEncoder()
const SESSION_KEYS_LABEL = 'c2pa.session-keys'

function loadFixture(name: string): Uint8Array {
	return new Uint8Array(readFileSync(new URL(`./fixtures/${name}`, import.meta.url)))
}

describe('readC2paManifest', () => {
	// #region example
	it('parses a C2PA manifest from an init segment', () => {
		const bytes = loadFixture('init_signed_with_session_keys.m4s')
		const manifestStore = readC2paManifest(bytes)

		ok(manifestStore.manifest, 'manifest should be present')
		ok(typeof manifestStore.manifest.label === 'string', 'label should be a string')
	})
	// #endregion example

	it('returns assertions array', () => {
		const bytes = loadFixture('init_signed_with_session_keys.m4s')
		const { manifest } = readC2paManifest(bytes)

		ok(Array.isArray(manifest.assertions), 'assertions should be an array')
	})

	it('returns signatureInfo with issuer', () => {
		const bytes = loadFixture('init_signed_with_session_keys.m4s')
		const { manifest } = readC2paManifest(bytes)

		ok(
			typeof manifest.signatureInfo.issuer === 'string' || manifest.signatureInfo.issuer === null,
			'issuer should be string or null',
		)
	})

	it('parses a media segment with c2pa.livevideo.segment assertion', () => {
		const bytes = loadFixture('test-segment.m4s')

		doesNotThrow(() => readC2paManifest(bytes))

		const { manifest } = readC2paManifest(bytes)
		const liveVideoAssertion = manifest.assertions.find((a: C2paAssertion) => a.label === 'c2pa.livevideo.segment')

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
		const { manifest } = readC2paManifest(bytes)

		ok(
			typeof manifest.instanceId === 'string' || manifest.instanceId === null,
			'instanceId should be string or null',
		)
	})

	it('projects the createdAt of a session key to a Date in the public data', () => {
		const { manifest } = readC2paManifest(loadFixture('vsi_init_with_signer_binding.mp4'))
		const assertion = manifest.assertions.find(a => a.label === SESSION_KEYS_LABEL)
		const [key] = (assertion?.data as { keys: { createdAt: unknown }[] }).keys

		ok(key.createdAt instanceof Date)
		strictEqual(key.createdAt.toISOString(), '2026-09-20T21:12:18.000Z')
	})

	it('keeps the CBOR tag of the createdAt of a session key in taggedData', () => {
		const { assertions } = readC2paManifest(loadFixture('vsi_init_with_signer_binding.mp4'))
		const assertion = assertions.find(a => a.label === SESSION_KEYS_LABEL)
		const [key] = (assertion?.taggedData as { keys: { createdAt: unknown }[] }).keys

		ok(key.createdAt instanceof CborTag)
		strictEqual(key.createdAt.tag, 0)
		strictEqual(key.createdAt.value, '2026-09-20T21:12:18Z')
	})

	it('reads a JSON assertion and a binary assertion without taggedData', () => {
		const manifest = buildJumb('urn:uuid:test-manifest',
			buildJumb('c2pa.claim', buildBox('cbor', Uint8Array.of(0xa0))),
			buildJumb('c2pa.assertions',
				buildJumb('com.example.json', buildBox('json', TEXT_ENCODER.encode('{"kind":"json"}'))),
				buildJumb('com.example.binary', buildBox('bidb', Uint8Array.of(0xff, 0xd8))),
			),
		)

		const { assertions } = readC2paManifest(buildInitSegmentWithManifest(manifest))

		deepStrictEqual(assertions.map(a => [a.label, a.data, a.taggedData]), [
			['com.example.json', { kind: 'json' }, undefined],
			['com.example.binary', Uint8Array.of(0xff, 0xd8), undefined],
		])
	})
})
