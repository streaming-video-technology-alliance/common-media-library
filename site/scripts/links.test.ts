import { equal } from 'node:assert/strict'
import { describe, it } from 'node:test'
import { rewriteReadmeLinks } from './links.ts'

describe('rewriteReadmeLinks', () => {
	it('points a docs link at the guides folder', () => {
		equal(
			rewriteReadmeLinks('[Reading boxes](docs/reading-boxes.md)'),
			'[Reading boxes](guides/reading-boxes.md)',
		)
	})

	it('accepts a leading ./ and keeps the anchor', () => {
		equal(
			rewriteReadmeLinks('[Keys](./docs/user-guide.md#custom-keys)'),
			'[Keys](guides/user-guide.md#custom-keys)',
		)
	})

	it('leaves other links unchanged', () => {
		const markdown = '[Spec](https://example.com/docs/spec.md) and [Changelog](CHANGELOG.md)'
		equal(rewriteReadmeLinks(markdown), markdown)
	})

	it('rewrites every link in the text', () => {
		const result = rewriteReadmeLinks('[A](docs/a.md), [B](docs/b.md)')
		equal(result, '[A](guides/a.md), [B](guides/b.md)')
	})
})
