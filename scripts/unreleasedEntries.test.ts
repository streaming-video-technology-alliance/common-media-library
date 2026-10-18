import { deepEqual } from 'node:assert/strict'
import { describe, it } from 'node:test'
import { unreleasedEntries } from './unreleasedEntries.ts'

const header = `# Changelog

All notable changes to this project will be documented in this file.
`

describe('unreleasedEntries', () => {
	it('returns no entries when the changelog has no Unreleased section', () => {
		const changelog = `${header}
## [1.0.0] - 2026-10-01

### Added

- First release

[Unreleased]: https://example.com/compare/v1.0.0...HEAD
`
		deepEqual(unreleasedEntries(changelog), [])
	})

	it('returns no entries when the Unreleased section is empty', () => {
		const changelog = `${header}
## [Unreleased]

## [1.0.0] - 2026-10-01

### Added

- First release
`
		deepEqual(unreleasedEntries(changelog), [])
	})

	it('returns the entries under every subheading of the Unreleased section', () => {
		const changelog = `${header}
## [Unreleased]

### Changed

- README: the usage example is complete

### Fixed

- The parser accepts an empty value

## [1.0.0] - 2026-10-01
`
		deepEqual(unreleasedEntries(changelog), [
			'README: the usage example is complete',
			'The parser accepts an empty value',
		])
	})

	it('stops at the next version section', () => {
		const changelog = `${header}
## [Unreleased]

- Pending change

## [1.0.0] - 2026-10-01

### Added

- First release
`
		deepEqual(unreleasedEntries(changelog), ['Pending change'])
	})

	it('ignores indented continuation lines of an entry', () => {
		const changelog = `${header}
## [Unreleased]

- Top-level entry
  - nested detail
  continued prose

## [1.0.0] - 2026-10-01
`
		deepEqual(unreleasedEntries(changelog), ['Top-level entry'])
	})
})
