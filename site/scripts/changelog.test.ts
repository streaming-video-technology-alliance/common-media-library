import { deepEqual, equal } from 'node:assert/strict'
import { describe, it } from 'node:test'
import { parseReleases, renderReleases, sortReleases, type Release } from './changelog.ts'

const pkg = { name: '@svta/cml-cmcd', folder: 'cmcd' }

const changelog = `# Changelog

## [Unreleased]

### Changed

- Pending

## [2.8.3] - 2026-10-18

### Changed

- Something

## [2.8.2] - 2026-10-08

### Fixed

- Something else

[Unreleased]: https://example.com/compare/cmcd-v2.8.3...HEAD
`

describe('parseReleases', () => {
	it('returns one release per version heading and skips Unreleased', () => {
		deepEqual(parseReleases(changelog, pkg), [
			{ package: '@svta/cml-cmcd', folder: 'cmcd', version: '2.8.3', date: '2026-10-18' },
			{ package: '@svta/cml-cmcd', folder: 'cmcd', version: '2.8.2', date: '2026-10-08' },
		])
	})

	it('accepts a prerelease version', () => {
		const releases = parseReleases('## [1.0.0-beta.1] - 2026-01-01\n', pkg)
		equal(releases[0]?.version, '1.0.0-beta.1')
	})
})

describe('sortReleases', () => {
	it('sorts newest first, then by package name', () => {
		const releases: Release[] = [
			{ package: '@svta/cml-utils', folder: 'utils', version: '1.0.0', date: '2026-10-01' },
			{ package: '@svta/cml-cmcd', folder: 'cmcd', version: '2.0.0', date: '2026-10-18' },
			{ package: '@svta/cml-abr', folder: 'abr', version: '0.2.0', date: '2026-10-18' },
		]
		deepEqual(
			sortReleases(releases).map(r => r.package),
			['@svta/cml-abr', '@svta/cml-cmcd', '@svta/cml-utils'],
		)
	})
})

describe('renderReleases', () => {
	it('renders a table with one row per release', () => {
		const text = renderReleases([
			{ package: '@svta/cml-cmcd', folder: 'cmcd', version: '2.8.3', date: '2026-10-18' },
		])
		equal(text.startsWith('# Releases\n'), true)
		equal(text.includes('| Date | Package | Version |'), true)
		equal(
			text.includes('| 2026-10-18 | [@svta/cml-cmcd](/packages/cmcd/changelog) | 2.8.3 |'),
			true,
		)
	})
})
