import './init.ts'

import type { Presentation } from '@svta/cml-cmaf-ham'
import { hamToHls, hlsToHam } from '@svta/cml-cmaf-ham'
import { deepStrictEqual, equal } from 'node:assert'
import { describe, it } from 'node:test'

import { hlsMain1, hlsPlaylist1 } from './data/hls-samples/sample-1/hlsSample1.ts'
import { hlsMain2, hlsPlaylist2 } from './data/hls-samples/sample-2/hlsSample2.ts'
import { hlsMain3, hlsPlaylist3 } from './data/hls-samples/sample-3/hlsSample3.ts'

import ham1 from './data/ham-samples/fromHls/ham1.json' with { type: 'json' }
import ham2 from './data/ham-samples/fromHls/ham2.json' with { type: 'json' }
import ham3 from './data/ham-samples/fromHls/ham3.json' with { type: 'json' }


describe('hlsToHam', () => {
	it('converts hls1 to ham1', () => {
		const convertedHam = hlsToHam(hlsMain1, hlsPlaylist1)
		deepStrictEqual(convertedHam, ham1)
	})

	it('converts hls2 to ham2', () => {
		const convertedHam = hlsToHam(hlsMain2, hlsPlaylist2)
		deepStrictEqual(convertedHam, ham2)
	})

	it('converts hls3 to ham3', () => {
		const convertedHam = hlsToHam(hlsMain3, hlsPlaylist3)
		deepStrictEqual(convertedHam, ham3)
	})
})

describe.skip('hamToHls', () => {
	// FIXME: the manifest is missing some of the original metadata

	it('converts ham1 to hls', () => {
		const presentations = ham1 as unknown as Presentation[]
		const convertedHls = hamToHls(presentations)
		deepStrictEqual(convertedHls.manifest, hlsMain1)
		equal(convertedHls.type, 'hls')
		deepStrictEqual(convertedHls.ancillaryManifests, hlsPlaylist1)
	})

	it('converts ham2 to hls', () => {
		const presentations = ham2 as unknown as Presentation[]
		const convertedHls = hamToHls(presentations)
		deepStrictEqual(convertedHls.manifest, hlsMain2)
		equal(convertedHls.type, 'hls')
		deepStrictEqual(convertedHls.ancillaryManifests, hlsPlaylist2)
	})

	it('converts ham3 to hls', () => {
		const presentations = ham3 as unknown as Presentation[]
		const convertedHls = hamToHls(presentations)
		deepStrictEqual(convertedHls.manifest, hlsMain3)
		equal(convertedHls.type, 'hls')
		deepStrictEqual(convertedHls.ancillaryManifests, hlsPlaylist3)
	})
})

// This tests are skipped due to differences between the original manifest and the generated one.
describe.skip('hls to ham to hls', () => {
	it('converts hls1 to ham1 to hls1 again', () => {
		const convertedHam = hlsToHam(hlsMain1, hlsPlaylist1)
		const convertedHls = hamToHls(convertedHam)
		deepStrictEqual(convertedHls.manifest, hlsMain1)
		deepStrictEqual(convertedHls.ancillaryManifests, hlsPlaylist1)
	})

	it('converts hls2 to ham2 to hls2 again', () => {
		const convertedHam = hlsToHam(hlsMain2, hlsPlaylist2)
		const convertedHls = hamToHls(convertedHam)
		deepStrictEqual(convertedHls.manifest, hlsMain2)
		deepStrictEqual(convertedHls.ancillaryManifests, hlsPlaylist2)
	})

	it('converts hls3 to ham3 to hls3 again', () => {
		const convertedHam = hlsToHam(hlsMain3, hlsPlaylist3)
		const convertedHls = hamToHls(convertedHam)
		deepStrictEqual(convertedHls.manifest, hlsMain3)
		deepStrictEqual(convertedHls.ancillaryManifests, hlsPlaylist3)
	})
})
