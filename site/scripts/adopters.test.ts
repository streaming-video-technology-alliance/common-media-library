import { deepEqual, throws } from 'node:assert/strict'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, it } from 'node:test'
import { loadAdopters } from './adopters.ts'

const folders = new Set(['cmcd', 'utils'])

function file(content: unknown): string {
	const dir = mkdtempSync(path.join(tmpdir(), 'cml-adopters-'))
	const target = path.join(dir, 'adopters.json')
	writeFileSync(target, JSON.stringify(content))
	return target
}

describe('loadAdopters', () => {
	it('returns valid entries unchanged', () => {
		const entries = [
			{ name: 'hls.js', url: 'https://github.com/video-dev/hls.js', packages: ['cmcd', 'utils'] },
		]
		deepEqual(loadAdopters(file(entries), folders), entries)
	})

	it('keeps an optional note', () => {
		const entries = [
			{ name: 'Shaka Player', url: 'https://example.com', packages: [], note: 'Ports the code.' },
		]
		deepEqual(loadAdopters(file(entries), folders), entries)
	})

	it('rejects a missing name', () => {
		throws(
			() => loadAdopters(file([{ name: '', url: 'https://example.com', packages: [] }]), folders),
			/adopters\.json entry 1: name/,
		)
	})

	it('rejects a URL that is not https', () => {
		throws(
			() => loadAdopters(file([{ name: 'x', url: 'http://example.com', packages: [] }]), folders),
			/entry 1: url must start with https/,
		)
	})

	it('rejects an unknown package folder', () => {
		throws(
			() =>
				loadAdopters(
					file([{ name: 'x', url: 'https://example.com', packages: ['nope'] }]),
					folders,
				),
			/entry 1: unknown package "nope"/,
		)
	})

	it('rejects a file that is not an array', () => {
		throws(() => loadAdopters(file({}), folders), /must be an array/)
	})
})
