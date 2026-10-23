import { readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmd } from './cmd.ts'
import { viewPublished, viewPublishedPeers } from './npmView.ts'
import { projects } from './projects.ts'
import { satisfiesRange } from './satisfiesRange.ts'

type PackageName = string
type PackageFolder = string
type PackageFile = string
type PackageJson = {
	name: PackageName
	version: string
	peerDependencies: Record<string, string>
}
type Package = [PackageFolder, PackageFile, PackageJson]
type Packages = Record<PackageName, Package>

async function loadPackage(folder: string): Promise<Package> {
	console.log(`Loading ${folder}...`)
	const file = path.resolve(folder, 'package.json')
	const packageJson = JSON.parse(await readFile(file, 'utf8'))
	return [folder, file, packageJson]
}

async function loadPackages(): Promise<Packages> {
	return (await Promise.all(projects.map(loadPackage))).reduce((result, pkg) => {
		result[pkg[2].name] = pkg
		return result
	}, {} as Packages)
}

const tagRegex = /^\d+\.\d+\.\d+(.*$)/

async function getChanges(folder: string, version: string): Promise<string> {
	const changelog = await readFile(path.resolve(folder, 'CHANGELOG.md'), 'utf8')
	const sections = changelog.split(/^## /m)
	const match = `[${version}]`
	const section = sections.find(s => s.includes(match)) || ''
	return section.split('\n\n').slice(1).join('\n\n')
}

async function createRelease(folder: string, json: PackageJson): Promise<void> {
	const folderName = path.basename(folder)
	const tag = `${folderName}-v${json.version}`
	const title = `${json.name} v${json.version}`
	const notes = await getChanges(folder, json.version)
	const notesFile = path.join(tmpdir(), `release-notes-${folderName}.md`)
	await writeFile(notesFile, notes)
	const prerelease = json.version.replace(tagRegex, '$1') ? '--prerelease' : ''
	await cmd(
		`gh release create "${tag}" --target main --title "${title}" --notes-file "${notesFile}" ${prerelease}`,
	)
}

// Check for updates and resolve wildcard peer dependencies to caret ranges
async function processPackage(
	name: PackageName,
	pkg: Package,
	packages: Packages,
): Promise<string> {
	console.log(`Processing ${name}...`)
	const [folder, file, packageJson] = pkg
	const { version, peerDependencies = {} } = packageJson

	let peersUpdated = false
	Object.entries(peerDependencies).forEach(([dep, range]) => {
		if (!packages[dep] || range !== '*') {
			return
		}

		peersUpdated = true
		peerDependencies[dep] = `^${packages[dep][2].version}`
	})

	if (peersUpdated) {
		await writeFile(file, JSON.stringify(packageJson, null, '\t') + '\n')
	}

	const tag = version.replace(tagRegex, '$1')
	const prop = tag ? 'dist-tags.prerelease' : 'version'
	const latest = await viewPublished(name, prop)

	if (latest === undefined) {
		console.log(`${name} is not on npm yet. Publishing ${version}...`)
		return folder
	}

	const updated = latest !== version

	if (!updated) {
		const publishedPeers = await viewPublishedPeers(name)

		for (const dep in publishedPeers) {
			if (!packages[dep]) {
				continue
			}

			const range = publishedPeers[dep]
			const currentPeer = packages[dep][2].version

			if (!satisfiesRange(currentPeer, range)) {
				throw new Error(
					`Package ${name} (${version}) needs a version bump. Its published release accepts ${dep}@${range}, and ${dep} is now ${currentPeer}. Run "npm run prepare-release".`,
				)
			}
		}
	}

	return updated ? folder : ''
}

const packages = await loadPackages()
const needsPublish: [PackageJson, string][] = await Promise.all(
	Object.entries(packages).map(async ([name, pkg]) => {
		const result = await processPackage(name, pkg, packages)
		return [pkg[2], result]
	}),
)

// Publish the packages
for (const pkg of needsPublish) {
	const [json, folder] = pkg

	if (!folder) {
		continue
	}

	const tag = json.version.replace(tagRegex, '$1')
	await cmd(
		`npm publish --provenance --access public -w ${folder} ${tag ? `--tag prerelease` : ''}`,
	)
	await createRelease(folder, json)
}
