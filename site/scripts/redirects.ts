import type { PackageInfo } from './packages.ts'

export type Redirect = {
	from: string;
	to: string;
}

// Markdown folder name to the folder name of the old HTML site.
const kindDirs: Record<string, string> = {
	'classes': 'classes',
	'enumerations': 'enums',
	'functions': 'functions',
	'interfaces': 'interfaces',
	'type-aliases': 'types',
	'variables': 'variables',
}

// `@svta/cml-cmcd` was `_svta_cml-cmcd` in every old file name.
export function oldPrefix(packageName: string): string {
	return packageName.replace(/[@/]/g, '_')
}

// The old site named a guide page after its frontmatter title, with `_` for spaces and slashes.
export function documentName(title: string): string {
	return title.replace(/[\s/]/g, '_')
}

// `apiFiles` are paths relative to `site/api`, such as `cmcd/functions/encodeCmcd.md`.
export function redirectsFor(packages: PackageInfo[], apiFiles: string[]): Redirect[] {
	const redirects: Redirect[] = [
		{ from: 'modules.html', to: '/packages/' },
		{ from: 'hierarchy.html', to: '/api/' },
	]
	const byFolder = new Map(packages.map(pkg => [pkg.folder, pkg]))

	for (const pkg of packages) {
		const prefix = oldPrefix(pkg.name)
		redirects.push({ from: `modules/${prefix}.html`, to: `/api/${pkg.folder}/` })

		for (const guide of pkg.guides) {
			redirects.push({ from: `documents/${prefix}.${documentName(guide.title)}.html`, to: `/packages/${pkg.folder}/guides/${guide.slug}` })
		}
	}

	for (const file of apiFiles) {
		const [folder, kindDir, name] = file.split('/')
		const pkg = folder ? byFolder.get(folder) : undefined
		const oldDir = kindDir ? kindDirs[kindDir] : undefined

		if (!pkg || !oldDir || !name?.endsWith('.md')) {
			continue
		}

		const symbol = name.slice(0, -'.md'.length)
		redirects.push({ from: `${oldDir}/${oldPrefix(pkg.name)}.${symbol}.html`, to: `/api/${pkg.folder}/${kindDir}/${symbol}` })
	}

	return redirects
}

// `base` starts and ends with `/`. `to` starts with `/`.
export function redirectHtml(to: string, base: string): string {
	const url = `${base}${to.slice(1)}`

	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Redirecting</title>
<meta http-equiv="refresh" content="0; url=${url}">
<link rel="canonical" href="${url}">
<meta name="robots" content="noindex">
</head>
<body>
<p>This page moved to <a href="${url}">${url}</a>.</p>
</body>
</html>
`
}
