import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { parseFrontmatter } from './frontmatter.ts'
import { groupOrder, groups, type PackageGroup } from './groups.ts'

const scope = '@svta/cml-'

export type GuideInfo = {
	slug: string
	title: string
}

export type PackageInfo = {
	folder: string
	name: string
	version: string
	description: string
	group: PackageGroup
	guides: GuideInfo[]
	peers: string[]
}

type Manifest = {
	name: string
	version: string
	description?: string
	peerDependencies?: Record<string, string>
}

function loadGuides(docsDir: string): GuideInfo[] {
	if (!existsSync(docsDir)) {
		return []
	}

	return readdirSync(docsDir)
		.filter(file => file.endsWith('.md'))
		.sort()
		.map(file => {
			const slug = file.slice(0, -'.md'.length)
			const { attributes } = parseFrontmatter(readFileSync(path.join(docsDir, file), 'utf8'))
			return { slug, title: attributes['title'] ?? slug }
		})
}

export function loadPackage(libsDir: string, folder: string): PackageInfo {
	const dir = path.join(libsDir, folder)
	const manifest = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8')) as Manifest
	const group = groups[folder]

	if (!group) {
		throw new Error(
			`site/scripts/groups.ts has no group for "${folder}". Add it to one of: ${groupOrder.join(', ')}.`,
		)
	}

	const peers = Object.keys(manifest.peerDependencies ?? {})
		.filter(name => name.startsWith(scope))
		.map(name => name.slice(scope.length))
		.sort()

	return {
		folder,
		name: manifest.name,
		version: manifest.version,
		description: manifest.description ?? '',
		group,
		peers,
		guides: loadGuides(path.join(dir, 'docs')),
	}
}

export function renderPackageIndex(packages: PackageInfo[]): string {
	const sections = groupOrder
		.filter(group => packages.some(pkg => pkg.group === group))
		.map(group => {
			const rows = packages
				.filter(pkg => pkg.group === group)
				.sort((a, b) => a.folder.localeCompare(b.folder))
				.map(
					pkg =>
						`| [${pkg.name}](/packages/${pkg.folder}/) | ${pkg.version} | ${pkg.description} |`,
				)

			return `## ${group}\n\n| Package | Version | Description |\n| --- | --- | --- |\n${rows.join('\n')}\n`
		})

	return `# Packages\n\nEvery published package, grouped by domain. Open a package for its overview, guides, API reference, and changelog.\n\n${sections.join('\n')}`
}
