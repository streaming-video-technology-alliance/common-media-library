import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { projects } from './projects.ts'

export const siteBase = 'https://streaming-video-technology-alliance.github.io/common-media-library/'
export const sourceBase = 'https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/'
export const skillDir = 'skills/common-media-library'
export const repoRoot: string = path.resolve(import.meta.dirname, '..')
export const indexStart = '<!-- packages:start -->'
export const indexEnd = '<!-- packages:end -->'
const installCommand = 'npx skills add streaming-video-technology-alliance/common-media-library'

const sectionHeading = '## When to use'
const minBullets = 2
const maxBullets = 8
const exportLine = /^export (?:function|const|class|type) ([A-Za-z_$][\w$]*)/gm
const exportList = /^export \{([^}]*)\}/gm
const identifier = /`([^`]+)`/g
const identifierShape = /^[A-Za-z_$][\w$]*$/

export type Bullet = {
	task: string;
	exports: string[];
	text: string;
};

export type WhenToUse = {
	bullets: Bullet[];
	closing: string;
	text: string;
};

export type Guide = {
	path: string;
	title: string;
	description: string;
	text: string;
};

export type PackageDocs = {
	folder: string;
	slug: string;
	name: string;
	description: string;
	readme: string;
	guides: Guide[];
	apiReportPath: string;
	apiReport: string;
	whenToUse: WhenToUse;
};

function shape(file: string, problem: string): Error {
	return new Error(`${file}: ${problem}. Expected a "${sectionHeading}" heading, ${minBullets} to ${maxBullets} bullets of the form "- <task>: \`export\`, \`export\`", and a closing paragraph.`)
}

function parseBullet(text: string, file: string): Bullet {
	const colon = text.indexOf(':')

	if (colon === -1) {
		throw shape(file, `the bullet "${text}" has no colon`)
	}

	const task = text.slice(0, colon).trim()
	const rest = text.slice(colon + 1)
	const exports = Array.from(rest.matchAll(identifier), m => m[1])

	if (exports.length === 0) {
		throw shape(file, `the bullet "${text}" names no export after the colon`)
	}

	if (rest.replace(identifier, '').replace(/[,\s]/g, '') !== '') {
		throw shape(file, `the bullet "${text}" has text after the colon that is not an export list`)
	}

	for (const name of exports) {
		if (!identifierShape.test(name)) {
			throw shape(file, `"${name}" in the bullet "${text}" is not an identifier`)
		}
	}

	return { task, exports, text }
}

/**
 * Returns the `## When to use` section of a README.
 * Throws when the section is missing or does not have the expected shape.
 */
export function parseWhenToUse(readme: string, file: string): WhenToUse {
	const lines = readme.split('\n')
	const start = lines.indexOf(sectionHeading)

	if (start === -1) {
		throw shape(file, 'the heading is missing')
	}

	const next = lines.findIndex((line, i) => i > start && line.startsWith('## '))
	const body = lines.slice(start + 1, next === -1 ? lines.length : next)
	const bullets: Bullet[] = []
	const closing: string[] = []

	for (const line of body) {
		if (line.startsWith('- ')) {
			if (closing.length > 0) {
				throw shape(file, `the bullet "${line}" comes after the closing paragraph`)
			}
			bullets.push(parseBullet(line.slice(2), file))
		}
		else if (line.trim() !== '') {
			if (bullets.length === 0) {
				throw shape(file, `the line "${line}" comes before the first bullet`)
			}
			closing.push(line)
		}
	}

	if (bullets.length < minBullets || bullets.length > maxBullets) {
		throw shape(file, `the section has ${bullets.length} bullets`)
	}

	if (closing.length === 0) {
		throw shape(file, 'the closing paragraph is missing')
	}

	return { bullets, closing: closing.join('\n'), text: body.join('\n').trim() }
}

/** Returns the names of every function, const, class, and type that an API report exports. */
export function readExports(apiReport: string): Set<string> {
	const names = new Set(Array.from(apiReport.matchAll(exportLine), m => m[1]))

	for (const list of apiReport.matchAll(exportList)) {
		for (const item of list[1].split(',')) {
			const name = item.trim().split(/\s+as\s+/).pop()

			if (name) {
				names.add(name)
			}
		}
	}

	return names
}

/** Throws when a bullet names an identifier that the package does not export. */
export function checkExports(section: WhenToUse, exports: Set<string>, file: string): void {
	for (const bullet of section.bullets) {
		for (const name of bullet.exports) {
			if (!exports.has(name)) {
				throw new Error(`${file}: "${name}" in the bullet "${bullet.text}" is not an export of the package. Check the API report under config/.`)
			}
		}
	}
}

const link = /\]\(([^)\s]+)\)/g
const notRelative = /^([a-z][a-z0-9+.-]*:|#|\/)/i
const fenceLine = /^(```.*)$/m

/**
 * Rewrites every relative markdown link in `markdown`. `sourcePath` is the repo path of the file
 * that holds the text. `toUrl` receives the repo path of the link target and returns the URL.
 * The content of fenced code blocks stays unchanged.
 */
export function rewriteLinks(markdown: string, sourcePath: string, toUrl: (repoPath: string) => string): string {
	const dir = path.posix.dirname(sourcePath)
	let fenced = false

	const rewrite = (text: string): string => text.replace(link, (match, target: string) => {
		if (notRelative.test(target)) {
			return match
		}

		const hash = target.indexOf('#')
		const file = hash === -1 ? target : target.slice(0, hash)
		const anchor = hash === -1 ? '' : target.slice(hash)
		const repoPath = path.posix.normalize(path.posix.join(dir, file))

		return `](${toUrl(repoPath)}${anchor})`
	})

	return markdown.split(fenceLine).map((part, i) => {
		if (i % 2 === 1) {
			fenced = !fenced
			return part
		}

		return fenced ? part : rewrite(part)
	}).join('')
}

/** The GitHub URL of a repo path. */
export function sourceUrl(repoPath: string): string {
	return sourceBase + repoPath
}

/**
 * Returns a `toUrl` for the docs site. `copies` maps a repo path to the path of its copy under the
 * site root. A target without a copy points at GitHub.
 */
export function siteUrl(copies: Map<string, string>): (repoPath: string) => string {
	return (repoPath) => {
		const copy = copies.get(repoPath)
		return copy === undefined ? sourceUrl(repoPath) : siteBase + copy
	}
}

function readRepoFile(repoPath: string): string {
	return readFileSync(path.join(repoRoot, repoPath), 'utf8')
}

function loadGuide(repoPath: string): Guide {
	const text = readRepoFile(repoPath)
	const front = text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? ''
	const field = (key: string): string => front.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1].trim() ?? ''

	return {
		path: repoPath,
		title: field('title') || path.posix.basename(repoPath, '.md'),
		description: field('description'),
		text,
	}
}

/** Reads one package and validates its When to use section against its API report. */
export function loadPackageDocs(folder: string): PackageDocs {
	const slug = path.posix.basename(folder)
	const json = JSON.parse(readRepoFile(`${folder}/package.json`)) as { name: string; description: string }
	const readmePath = `${folder}/README.md`
	const readme = readRepoFile(readmePath)
	const configDir = path.join(repoRoot, folder, 'config')
	const reportFile = existsSync(configDir) ? readdirSync(configDir).find(f => f.endsWith('.api.md')) : undefined

	if (reportFile === undefined) {
		throw new Error(`${folder}: no API report under config/. Build the package first.`)
	}

	const apiReportPath = `${folder}/config/${reportFile}`
	const apiReport = readRepoFile(apiReportPath)
	const docsDir = path.join(repoRoot, folder, 'docs')
	const guides = existsSync(docsDir)
		? readdirSync(docsDir).filter(f => f.endsWith('.md')).sort().map(f => loadGuide(`${folder}/docs/${f}`))
		: []
	const whenToUse = parseWhenToUse(readme, readmePath)

	checkExports(whenToUse, readExports(apiReport), readmePath)

	return { folder, slug, name: json.name, description: json.description, readme, guides, apiReportPath, apiReport, whenToUse }
}

/** Reads every published package, ordered by folder name. */
export function loadAllPackageDocs(): PackageDocs[] {
	return projects.map(loadPackageDocs).sort((a, b) => a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0)
}

/** Maps the repo path of every file that the site copies to its path under the site root. */
export function siteCopies(packages: PackageDocs[]): Map<string, string> {
	const copies = new Map<string, string>()

	for (const pkg of packages) {
		copies.set(`${pkg.folder}/README.md`, `llms/${pkg.slug}/README.md`)
		for (const guide of pkg.guides) {
			copies.set(guide.path, `llms/${pkg.slug}/docs/${path.posix.basename(guide.path)}`)
		}
		copies.set(pkg.apiReportPath, `llms/${pkg.slug}/api.md`)
	}

	return copies
}

/** The package index that goes between the markers in SKILL.md. */
export function renderIndex(packages: PackageDocs[]): string {
	return packages.map(pkg => [
		`### ${pkg.name}`,
		'',
		pkg.description,
		'',
		pkg.whenToUse.text,
		'',
		`Reference: references/${pkg.slug}.md`,
	].join('\n')).join('\n\n')
}

/** The README, guides, and API report of one package in one markdown file. */
export function renderReference(pkg: PackageDocs, toUrl: (repoPath: string) => string): string {
	const sources: [string, string][] = [
		[`${pkg.folder}/README.md`, pkg.readme],
		...pkg.guides.map((guide): [string, string] => [guide.path, guide.text]),
		[pkg.apiReportPath, pkg.apiReport],
	]

	return sources
		.map(([repoPath, text]) => `<!-- ${repoPath} -->\n${rewriteLinks(text, repoPath, toUrl).trimEnd()}\n`)
		.join('\n')
}

/** Replaces the package index between the markers in SKILL.md. */
export function replaceIndex(skill: string, index: string): string {
	const start = skill.indexOf(indexStart)
	const end = skill.indexOf(indexEnd)

	if (start === -1 || end === -1 || end < start) {
		throw new Error(`${skillDir}/SKILL.md: the markers ${indexStart} and ${indexEnd} are missing or out of order.`)
	}

	return `${skill.slice(0, start + indexStart.length)}\n\n${index}\n\n${skill.slice(end)}`
}

/** The llms.txt index of the docs site. */
export function renderLlmsTxt(packages: PackageDocs[]): string {
	const skillUrl = `${sourceBase.replace('/blob/', '/tree/')}${skillDir}`

	return [
		'# Common Media Library',
		'',
		'> TypeScript libraries for web video players. Each package implements one media specification, such as CMCD, ID3, ISO BMFF, WebVTT, or DASH. Install only the packages that you need.',
		'',
		`Before you write code for a media specification in a player, check the package list below. The skill for coding agents installs with \`${installCommand}\`.`,
		'',
		'## Packages',
		'',
		...packages.map(pkg => `- [${pkg.name}](${siteBase}llms/${pkg.slug}/README.md): ${pkg.description}`),
		'',
		'## Guides',
		'',
		...packages.flatMap(pkg => pkg.guides.map(guide => `- [${guide.title}](${siteBase}llms/${pkg.slug}/docs/${path.posix.basename(guide.path)}): ${pkg.name}. ${guide.description}`)),
		'',
		'## API reports',
		'',
		...packages.map(pkg => `- [${pkg.name} API report](${siteBase}llms/${pkg.slug}/api.md): every public export of ${pkg.name} with its signature`),
		'',
		'## Optional',
		'',
		`- [llms-full.txt](${siteBase}llms-full.txt): every README, guide, and API report in one file`,
		`- [Agent skill](${skillUrl}): the Agent Skills bundle, install with \`${installCommand}\``,
		'',
	].join('\n')
}

/** Regenerates the package index in SKILL.md and one reference file per published package. */
export function writeSkill(): void {
	const packages = loadAllPackageDocs()
	const dir = path.join(repoRoot, skillDir)
	const skillPath = path.join(dir, 'SKILL.md')
	const refs = path.join(dir, 'references')
	const slugs = new Set(packages.map(pkg => `${pkg.slug}.md`))

	mkdirSync(refs, { recursive: true })
	writeFileSync(skillPath, replaceIndex(readFileSync(skillPath, 'utf8'), renderIndex(packages)))

	for (const file of readdirSync(refs)) {
		if (!slugs.has(file)) {
			rmSync(path.join(refs, file))
		}
	}

	for (const pkg of packages) {
		writeFileSync(path.join(refs, `${pkg.slug}.md`), renderReference(pkg, sourceUrl))
	}
}

if (import.meta.main) {
	const { values } = parseArgs({ options: { skill: { type: 'boolean' }, site: { type: 'string' } } })

	if (!values.skill && values.site === undefined) {
		throw new Error('Pass --skill, --site <dir>, or both.')
	}

	if (values.skill) {
		writeSkill()
		console.log(`Wrote ${skillDir}`)
	}
}
