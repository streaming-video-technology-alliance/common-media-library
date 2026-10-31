import type { PackageInfo } from './packages.ts'

export type Redirect = {
	from: string
	to: string
	// The old site gave every signature its own anchor, `member-1`. The new page has one heading per member.
	signatures?: boolean
	// Old heading id to new heading id, for headings whose id changed.
	anchors?: Record<string, string>
}

// Markdown folder name to the folder name of the old HTML site.
const kindDirs: Record<string, string> = {
	classes: 'classes',
	enumerations: 'enums',
	functions: 'functions',
	interfaces: 'interfaces',
	'type-aliases': 'types',
	variables: 'variables',
}

const signatureKinds = new Set(['classes', 'interfaces', 'type-aliases'])

// The old site dropped inline code and punctuation from heading ids. VitePress keeps them.
export const documentAnchors: Record<string, Record<string, string>> = {
	'documents/_svta_cml-c2pa.VSI_EMSG_Validation.html': {
		'vsiemsg-validation': 'vsi-emsg-validation',
	},
	'documents/_svta_cml-cmcd.Report_Recorder_Guide.html': {
		'-positive-assertion': 'waitfor-count-timeout-positive-assertion',
		'-snapshot': 'getreports-snapshot',
		'live-inspection-with': 'live-inspection-with-onreport',
	},
	'documents/_svta_cml-cmcd.User_Guide.html': {
		'absolute-urls-for': 'absolute-urls-for-nor',
		'complete-requestresponse-flow': 'complete-request-response-flow',
		'do-not-pair-with--for-the-same-state-change-field':
			'do-not-pair-update-with-recordevent-for-the-same-state-change-field',
		typing: 'typing-customdata',
		using: 'using-recordevent',
	},
	'documents/_svta_cml-cmcd.Validation_Guide.html': {
		'parsing-and-validating-manually': 'parsing-and-validating-application-cmcd-manually',
		using: 'using-validatecmcdevents',
		'using-1': 'using-validatecmcdrequest',
	},
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
			const from = `documents/${prefix}.${documentName(guide.title)}.html`
			const to = `/packages/${pkg.folder}/guides/${guide.slug}`
			const anchors = documentAnchors[from]
			redirects.push(anchors ? { from, to, anchors } : { from, to })
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
		const from = `${oldDir}/${oldPrefix(pkg.name)}.${symbol}.html`
		const to = `/api/${pkg.folder}/${kindDir}/${symbol}`
		redirects.push(signatureKinds.has(kindDir) ? { from, to, signatures: true } : { from, to })
	}

	return redirects
}

// `base` starts and ends with `/`. `to` starts with `/`.
// A meta refresh drops the URL fragment, so the script carries it. The meta refresh stays for browsers without scripts.
export function redirectHtml(redirect: Redirect, base: string): string {
	const url = `${base}${redirect.to.slice(1)}`
	const steps = ['var h = location.hash.slice(1)']

	if (redirect.anchors) {
		steps.push(`h = ${JSON.stringify(redirect.anchors)}[h] || h`)
	}

	if (redirect.signatures) {
		steps.push("h = h.replace(/-\\d+$/, '')")
	}

	steps.push(
		"h = h.replace(/_/g, '-').replace(/^-+|-+$/g, '')",
		`location.replace(${JSON.stringify(url)} + (h ? '#' + h : ''))`,
	)

	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Redirecting</title>
<script>${steps.join(';')}</script>
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
