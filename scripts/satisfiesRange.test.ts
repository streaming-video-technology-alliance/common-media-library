import { equal, throws } from 'node:assert/strict'
import { describe, it } from 'node:test'
import { satisfiesRange } from './satisfiesRange.ts'

describe('satisfiesRange', () => {
	it('matches an exact version only when equal', () => {
		equal(satisfiesRange('1.6.1', '1.6.1'), true)
		equal(satisfiesRange('1.6.2', '1.6.1'), false)
	})

	it('matches any release version for *', () => {
		equal(satisfiesRange('1.6.1', '*'), true)
		equal(satisfiesRange('0.0.1', '*'), true)
	})

	it('excludes prerelease versions from *', () => {
		equal(satisfiesRange('1.7.0-beta.1', '*'), false)
	})

	it('accepts a caret range within the same major', () => {
		equal(satisfiesRange('1.6.1', '^1.6.1'), true)
		equal(satisfiesRange('1.6.2', '^1.6.1'), true)
		equal(satisfiesRange('1.7.0', '^1.6.1'), true)
	})

	it('rejects a caret range below the floor or in the next major', () => {
		equal(satisfiesRange('1.6.0', '^1.6.1'), false)
		equal(satisfiesRange('2.0.0', '^1.6.1'), false)
	})

	it('treats the minor as the breaking segment for a caret range on 0.x', () => {
		equal(satisfiesRange('0.23.2', '^0.23.1'), true)
		equal(satisfiesRange('0.24.0', '^0.23.1'), false)
	})

	it('treats the patch as the breaking segment for a caret range on 0.0.x', () => {
		equal(satisfiesRange('0.0.1', '^0.0.1'), true)
		equal(satisfiesRange('0.0.2', '^0.0.1'), false)
	})

	it('accepts a prerelease only on the same release tuple as the floor', () => {
		equal(satisfiesRange('1.6.1-beta.2', '^1.6.1-beta.1'), true)
		equal(satisfiesRange('1.6.1', '^1.6.1-beta.1'), true)
		equal(satisfiesRange('1.6.1-alpha.1', '^1.6.1-beta.1'), false)
		equal(satisfiesRange('1.7.0-beta.1', '^1.6.1'), false)
		equal(satisfiesRange('2.0.0-beta.1', '^1.6.1'), false)
	})

	it('accepts any release version at or above the floor for >=', () => {
		equal(satisfiesRange('1.0.0', '>=1.0.0'), true)
		equal(satisfiesRange('2.0.0', '>=1.0.0'), true)
		equal(satisfiesRange('0.9.0', '>=1.0.0'), false)
		equal(satisfiesRange('1.7.0-beta.1', '>=1.0.0'), false)
	})

	it('throws for an unsupported range', () => {
		throws(() => satisfiesRange('1.0.0', '~1.0.0'), /Unsupported range "~1.0.0"/)
		throws(() => satisfiesRange('1.0.0', '>=1.0.0 <2.0.0'), /Unsupported range/)
		throws(() => satisfiesRange('1.0.0', '^latest'), /Unsupported range/)
	})
})
