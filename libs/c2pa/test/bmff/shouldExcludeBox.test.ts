import { readRootBoxes } from '../../src/bmff/readRootBoxes.ts'
import { shouldExcludeBox } from '../../src/bmff/shouldExcludeBox.ts'
import { strictEqual } from 'node:assert'
import { describe, it } from 'vite-plus/test'
import { buildBox, buildLargesizeBox, concatBytes } from '../merkle/merkleTestUtils.ts'

describe('shouldExcludeBox', () => {
	// #region example
	it('returns true when the box type matches the xpath', () => {
		const [emsg] = readRootBoxes(buildBox('emsg'))
		strictEqual(shouldExcludeBox(emsg, [{ xpath: '/emsg' }]), true)
	})
	// #endregion example

	it('returns false when no exclusion matches', () => {
		const [emsg] = readRootBoxes(buildBox('emsg'))
		strictEqual(shouldExcludeBox(emsg, [{ xpath: '/moof' }]), false)
	})

	it('returns false for an empty exclusion list', () => {
		const [emsg] = readRootBoxes(buildBox('emsg'))
		strictEqual(shouldExcludeBox(emsg, []), false)
	})

	it('returns false for an xpath that does not follow the §18.6.2 grammar', () => {
		const [emsg] = readRootBoxes(buildBox('emsg'))
		strictEqual(shouldExcludeBox(emsg, [{ xpath: 'emsg' }]), false)
	})

	// §18.6.2: an xpath names the box at that path. /moof/traf names the traf box inside moof, not the moof box.
	it('returns false for a nested xpath under the box', () => {
		const [moof] = readRootBoxes(buildBox('moof', buildBox('traf')))
		strictEqual(shouldExcludeBox(moof, [{ xpath: '/moof/traf' }]), false)
	})

	it('returns false for an exclusion with a subset', () => {
		const [moov] = readRootBoxes(buildBox('moov', new Uint8Array(16)))
		strictEqual(
			shouldExcludeBox(moov, [{ xpath: '/moov', subset: [{ offset: 8, length: 0 }] }]),
			false,
		)
	})

	// §19.2.3: a subset that covers every byte of the box leaves nothing of the box in the hash.
	it('returns true for subset ranges that cover the whole box', () => {
		const [moov] = readRootBoxes(buildBox('moov', buildBox('free')))
		strictEqual(
			shouldExcludeBox(moov, [{ xpath: '/moov', subset: [{ offset: 0, length: 0 }] }]),
			true,
		)
		strictEqual(
			shouldExcludeBox(moov, [
				{
					xpath: '/moov',
					subset: [
						{ offset: 0, length: 8 },
						{ offset: 8, length: 100 },
					],
				},
			]),
			true,
		)
		strictEqual(
			shouldExcludeBox(moov, [
				{ xpath: '/moov', subset: [{ offset: 0, length: 8 }] },
				{ xpath: '/moov/free' },
			]),
			true,
		)
	})

	it('returns false for subset ranges that leave a byte of the box', () => {
		const [moov] = readRootBoxes(buildBox('moov', new Uint8Array(16)))
		strictEqual(
			shouldExcludeBox(moov, [{ xpath: '/moov', subset: [{ offset: 1, length: 0 }] }]),
			false,
		)
		strictEqual(
			shouldExcludeBox(moov, [{ xpath: '/moov', subset: [{ offset: 0, length: 23 }] }]),
			false,
		)
	})

	describe('xpath index', () => {
		const [first, , second] = readRootBoxes(
			concatBytes(
				buildBox('uuid', Uint8Array.of(1)),
				buildBox('free'),
				buildBox('uuid', Uint8Array.of(2)),
			),
		)

		it('matches [1] against the first box of the type', () => {
			strictEqual(shouldExcludeBox(first, [{ xpath: '/uuid[1]' }]), true)
			strictEqual(shouldExcludeBox(second, [{ xpath: '/uuid[1]' }]), false)
		})

		it('matches [2] against the second box of the type', () => {
			strictEqual(shouldExcludeBox(first, [{ xpath: '/uuid[2]' }]), false)
			strictEqual(shouldExcludeBox(second, [{ xpath: '/uuid[2]' }]), true)
		})

		it('matches a node without an index against every box of the type', () => {
			strictEqual(shouldExcludeBox(first, [{ xpath: '/uuid' }]), true)
			strictEqual(shouldExcludeBox(second, [{ xpath: '/uuid' }]), true)
		})
	})

	describe('length constraint', () => {
		const [free] = readRootBoxes(buildBox('free', new Uint8Array(8)))

		it('matches a box whose length including the header equals the constraint', () => {
			strictEqual(shouldExcludeBox(free, [{ xpath: '/free', length: 16 }]), true)
		})

		it('does not match a box of another length', () => {
			strictEqual(shouldExcludeBox(free, [{ xpath: '/free', length: 8 }]), false)
		})
	})

	// A FullBox has a version byte and 3 flag bytes after the box header (ISO/IEC 14496-12 section 4.2).
	describe('version and flags constraints', () => {
		const FULLBOX_HEADER = Uint8Array.of(1, 0x00, 0x00, 0x05)
		const [meta] = readRootBoxes(buildBox('meta', concatBytes(FULLBOX_HEADER, new Uint8Array(4))))

		it('matches the version of the box', () => {
			strictEqual(shouldExcludeBox(meta, [{ xpath: '/meta', version: 1 }]), true)
			strictEqual(shouldExcludeBox(meta, [{ xpath: '/meta', version: 0 }]), false)
		})

		it('matches the flags exactly by default', () => {
			strictEqual(shouldExcludeBox(meta, [{ xpath: '/meta', flags: Uint8Array.of(0, 0, 5) }]), true)
			strictEqual(
				shouldExcludeBox(meta, [{ xpath: '/meta', flags: Uint8Array.of(0, 0, 1) }]),
				false,
			)
		})

		it('matches the flags as a bit mask when exact is false', () => {
			strictEqual(
				shouldExcludeBox(meta, [{ xpath: '/meta', flags: [0, 0, 1], exact: false }]),
				true,
			)
			strictEqual(
				shouldExcludeBox(meta, [{ xpath: '/meta', flags: [0, 0, 1], exact: true }]),
				false,
			)
			strictEqual(
				shouldExcludeBox(meta, [{ xpath: '/meta', flags: [0, 0, 2], exact: false }]),
				false,
			)
		})

		it('does not match a box too short for a version and flags', () => {
			const [short] = readRootBoxes(buildBox('meta', Uint8Array.of(1, 0)))
			strictEqual(shouldExcludeBox(short, [{ xpath: '/meta', version: 1 }]), false)
		})

		it('reads the version and flags after the 16-byte header of a largesize box', () => {
			const [large] = readRootBoxes(buildLargesizeBox('meta', FULLBOX_HEADER))
			strictEqual(shouldExcludeBox(large, [{ xpath: '/meta', version: 1, flags: [0, 0, 5] }]), true)
			strictEqual(shouldExcludeBox(large, [{ xpath: '/meta', version: 0 }]), false)
		})

		it('reads the version and flags after the usertype of a uuid box', () => {
			const [uuid] = readRootBoxes(
				buildBox('uuid', concatBytes(new Uint8Array(16), FULLBOX_HEADER)),
			)
			strictEqual(shouldExcludeBox(uuid, [{ xpath: '/uuid', version: 1, flags: [0, 0, 5] }]), true)
			strictEqual(shouldExcludeBox(uuid, [{ xpath: '/uuid', version: 0 }]), false)
		})
	})

	describe('data constraint', () => {
		const payload = new Uint8Array(16)
		payload[0] = 0xca
		payload[1] = 0xfe
		const [uuid] = readRootBoxes(buildBox('uuid', payload))

		it('matches the box bytes at the offset from the box start', () => {
			strictEqual(
				shouldExcludeBox(uuid, [
					{ xpath: '/uuid', data: [{ offset: 8, value: Uint8Array.of(0xca, 0xfe) }] },
				]),
				true,
			)
		})

		it('does not match other bytes', () => {
			strictEqual(
				shouldExcludeBox(uuid, [
					{ xpath: '/uuid', data: [{ offset: 8, value: Uint8Array.of(0xaa, 0xbb) }] },
				]),
				false,
			)
		})

		it('does not match a value that runs past the end of the box', () => {
			strictEqual(
				shouldExcludeBox(uuid, [
					{ xpath: '/uuid', data: [{ offset: 20, value: new Uint8Array(8) }] },
				]),
				false,
			)
		})
	})
})
