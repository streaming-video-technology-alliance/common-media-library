import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { cmd } from './cmd.ts'
import { viewPublished, viewPublishedPeers } from './npmView.ts'
import { projects } from './projects.ts'
import { satisfiesRange } from './satisfiesRange.ts'
import { unreleasedEntries } from './unreleasedEntries.ts'

type PackageJson = {
	name: string
	version: string
	peerDependencies?: Record<string, string>
}

type PackageInfo = {
	folder: string
	name: string
	current: PackageJson
	published: string | undefined
	publishedPeers: Record<string, string>
}

async function loadCurrentPackage(folder: string): Promise<PackageJson> {
	const file = path.resolve(folder, 'package.json')
	return JSON.parse(await readFile(file, 'utf8'))
}

async function loadPackages(): Promise<PackageInfo[]> {
	return Promise.all(
		projects.map(async folder => {
			const current = await loadCurrentPackage(folder)
			const published = await viewPublished(current.name, 'version')
			const publishedPeers = published ? await viewPublishedPeers(current.name) : {}
			return { folder, name: current.name, current, published, publishedPeers }
		}),
	)
}

function today(): string {
	const d = new Date()
	const yyyy = d.getFullYear()
	const mm = String(d.getMonth() + 1).padStart(2, '0')
	const dd = String(d.getDate()).padStart(2, '0')
	return `${yyyy}-${mm}-${dd}`
}

async function updateChangelog(
	folder: string,
	version: string,
	previousVersion: string,
	changes: string[],
): Promise<void> {
	const pkg = path.basename(folder)
	const file = path.resolve(folder, 'CHANGELOG.md')
	const changelog = await readFile(file, 'utf8')
	const sections = changelog.split(/^## /m)

	const changeEntries = changes.map(c => `- ${c}`).join('\n')
	sections.splice(2, 0, `[${version}] - ${today()}\n\n### Changed\n\n${changeEntries}\n\n`)

	const versionTag = `${pkg}-v${version}`
	const head = /v([0-9a-zA-Z.-]+)\.\.\.HEAD/
	const linkBreak = '\n'
	const last = sections.length - 1
	const links = sections[last].split(linkBreak)
	const index = links.findIndex(link => head.test(link))

	if (index >= 0) {
		const unreleased = links[index]
		links[index] = unreleased.replace(/\/[0-9a-z-]+v[0-9a-zA-Z.-]+\.\.\.HEAD/, `/${versionTag}...HEAD`)
		links.splice(
			index + 1,
			0,
			`[${version}]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/${pkg}-v${previousVersion}...${versionTag}`,
		)
	}

	sections[last] = links.join(linkBreak)
	await writeFile(file, sections.join('## '))
}

// Load all packages
const packages = await loadPackages()
const packagesByName = new Map(packages.map(p => [p.name, p]))

// Determine which packages have already changed their version in this branch
const changed = new Set<string>()
for (const pkg of packages) {
	if (!pkg.published || pkg.current.version !== pkg.published) {
		changed.add(pkg.name)
	}
}

console.log('Packages with version changes:')
for (const name of changed) {
	const pkg = packagesByName.get(name)
	if (!pkg) {
		continue
	}

	console.log(`  ${name}: ${pkg.published ?? 'new'} → ${pkg.current.version}`)
}

// Cascading patch loop: a package needs a patch when its published peer range rejects a changed peer
const patched: { name: string; from: string; to: string; changes: string[] }[] = []

let bumped = true
while (bumped) {
	bumped = false

	for (const pkg of packages) {
		if (changed.has(pkg.name)) {
			continue
		}

		const peers = pkg.current.peerDependencies ?? {}
		const changes: string[] = []

		for (const dep of Object.keys(peers)) {
			const depPkg = packagesByName.get(dep)

			if (!depPkg || !changed.has(dep)) {
				continue
			}

			const range = pkg.publishedPeers[dep]
			const newVersion = depPkg.current.version

			if (range && satisfiesRange(newVersion, range)) {
				continue
			}

			changes.push(`Update \`${dep}\` to ${newVersion}`)
		}

		if (changes.length === 0) {
			continue
		}

		// Bump the version: use prerelease for pre-release versions, patch otherwise
		const previousVersion = pkg.current.version
		const isPrerelease = /^\d+\.\d+\.\d+-.+$/.test(previousVersion)
		await cmd(`npm --no-git-tag-version version ${isPrerelease ? 'prerelease' : 'patch'} -w ${pkg.folder}`)

		// Re-read the updated version
		const updated = await loadCurrentPackage(pkg.folder)
		pkg.current = updated

		// Update the changelog
		await updateChangelog(pkg.folder, updated.version, previousVersion, changes)

		changed.add(pkg.name)
		patched.push({ name: pkg.name, from: previousVersion, to: updated.version, changes })
		bumped = true

		console.log(`\nPatched ${pkg.name}: ${previousVersion} → ${updated.version}`)
		for (const change of changes) {
			console.log(`  ${change}`)
		}
	}
}

if (patched.length === 0) {
	console.log('\nNo packages need patching.')
} else {
	console.log(`\n${patched.length} package(s) patched.`)
}

// Warn about packages that have unreleased changelog entries and no version change
const unreleased: string[] = []

for (const pkg of packages) {
	if (changed.has(pkg.name)) {
		continue
	}

	const changelog = await readFile(path.resolve(pkg.folder, 'CHANGELOG.md'), 'utf8')
	const count = unreleasedEntries(changelog).length

	if (count > 0) {
		unreleased.push(`  ${pkg.name} (${count} ${count === 1 ? 'entry' : 'entries'})`)
	}
}

if (unreleased.length > 0) {
	console.warn(`\nWarning: ${unreleased.length} package(s) have unreleased changelog entries and no version change:`)
	console.warn(unreleased.join('\n'))
	console.warn('Run "npm run ver <package> <version>" for each package whose changes should ship.')
}
