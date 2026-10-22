import { deepEqual, equal } from 'node:assert/strict'
import { describe, it } from 'node:test'
import { parseFrontmatter } from './frontmatter.ts'

describe('parseFrontmatter', () => {
	it('returns the attributes and the body', () => {
		const result = parseFrontmatter('---\ntitle: User Guide\ndescription: How to use it\n---\n\n# Heading\n')
		deepEqual(result.attributes, { title: 'User Guide', description: 'How to use it' })
		equal(result.body, '\n# Heading\n')
	})

	it('strips quotes around a value', () => {
		const result = parseFrontmatter('---\ntitle: "VSI/EMSG Validation"\n---\nbody')
		equal(result.attributes['title'], 'VSI/EMSG Validation')
	})

	it('returns no attributes when there is no block', () => {
		const result = parseFrontmatter('# Heading\n')
		deepEqual(result.attributes, {})
		equal(result.body, '# Heading\n')
	})

	it('keeps a colon inside the value', () => {
		const result = parseFrontmatter('---\ndescription: Note: read this\n---\n')
		equal(result.attributes['description'], 'Note: read this')
	})
})
