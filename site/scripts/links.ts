const docsLink = /\]\((?:\.\/)?docs\/([^)#]+\.md)(#[^)]*)?\)/g

// A README links to its guides as `docs/<file>.md`. The site serves them from `guides/`.
export function rewriteReadmeLinks(markdown: string): string {
	return markdown.replace(docsLink, (_match, file: string, hash: string | undefined) => `](guides/${file}${hash ?? ''})`)
}
