import path from 'node:path'

export const siteBase = 'https://streaming-video-technology-alliance.github.io/common-media-library/'
export const sourceBase = 'https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/'
export const skillDir = 'skills/common-media-library'

const sectionHeading = '## When to use'
const minBullets = 2
const maxBullets = 8
const exportLine = /^export (?:function|const|class|type) ([A-Za-z_$][\w$]*)/gm
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
	return new Set(Array.from(apiReport.matchAll(exportLine), m => m[1]))
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

/**
 * Rewrites every relative markdown link in `markdown`. `sourcePath` is the repo path of the file
 * that holds the text. `toUrl` receives the repo path of the link target and returns the URL.
 */
export function rewriteLinks(markdown: string, sourcePath: string, toUrl: (repoPath: string) => string): string {
	const dir = path.posix.dirname(sourcePath)

	return markdown.replace(link, (match, target: string) => {
		if (notRelative.test(target)) {
			return match
		}

		const hash = target.indexOf('#')
		const file = hash === -1 ? target : target.slice(0, hash)
		const anchor = hash === -1 ? '' : target.slice(hash)
		const repoPath = path.posix.normalize(path.posix.join(dir, file))

		return `](${toUrl(repoPath)}${anchor})`
	})
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
