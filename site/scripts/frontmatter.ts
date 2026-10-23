const block = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/

export type Frontmatter = {
	attributes: Record<string, string>
	body: string
}

// Parses a frontmatter block of `key: value` lines. Nested YAML is not supported.
export function parseFrontmatter(markdown: string): Frontmatter {
	const match = block.exec(markdown)

	if (!match) {
		return { attributes: {}, body: markdown }
	}

	const attributes: Record<string, string> = {}

	for (const line of match[1].split(/\r?\n/)) {
		const colon = line.indexOf(':')

		if (colon > 0) {
			const key = line.slice(0, colon).trim()
			const value = line
				.slice(colon + 1)
				.trim()
				.replace(/^["']|["']$/g, '')
			attributes[key] = value
		}
	}

	return { attributes, body: markdown.slice(match[0].length) }
}
