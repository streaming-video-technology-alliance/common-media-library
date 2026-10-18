const unreleasedHeading = /^## \[Unreleased\]/m
const sectionHeading = /^## /m
const entryPrefix = '- '

/**
 * Returns the list entries of the `## [Unreleased]` section of a changelog.
 * An entry is a line that starts with `- `. Subheadings and indented lines are not entries.
 */
export function unreleasedEntries(changelog: string): string[] {
	const start = changelog.match(unreleasedHeading)

	if (start?.index === undefined) {
		return []
	}

	const body = changelog.slice(start.index + start[0].length)
	const end = body.match(sectionHeading)
	const section = end?.index === undefined ? body : body.slice(0, end.index)

	return section
		.split('\n')
		.filter(line => line.startsWith(entryPrefix))
		.map(line => line.slice(entryPrefix.length))
}
