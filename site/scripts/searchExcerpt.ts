// The search index keeps the title and the first paragraph of an API page.
// Full API pages would make the index several megabytes.
export function searchExcerpt(markdown: string): string {
	const withoutCode = markdown.replace(/```[\s\S]*?```/g, '')
	const lines = withoutCode.split('\n')
	const titleIndex = lines.findIndex(line => line.startsWith('# '))

	if (titleIndex < 0) {
		return markdown
	}

	const title = lines[titleIndex]
	const paragraph = lines
		.slice(titleIndex + 1)
		.join('\n')
		.split(/\n\s*\n/)
		.map(part => part.trim())
		.find(part => part !== '' && !part.startsWith('#') && !part.startsWith('Defined in:') && !part.startsWith('|'))

	return paragraph ? `${title}\n\n${paragraph}\n` : `${title}\n`
}
