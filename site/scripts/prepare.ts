import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { parseReleases, renderReleases, retitleChangelog, type Release } from './changelog.ts'
import { rewriteReadmeLinks } from './links.ts'
import { loadPackage, renderPackageIndex, type PackageInfo } from './packages.ts'

const siteDir = path.resolve(import.meta.dirname, '..')
const root = path.resolve(siteDir, '..')
const libsDir = path.join(root, 'libs')
const packagesDir = path.join(siteDir, 'packages')
const releasesDir = path.join(siteDir, 'releases')

// scripts/projects.ts reads `libs` relative to the working directory.
process.chdir(root)
const { projects } = await import('../../scripts/projects.ts')

rmSync(packagesDir, { recursive: true, force: true })
rmSync(releasesDir, { recursive: true, force: true })
mkdirSync(packagesDir, { recursive: true })
mkdirSync(releasesDir, { recursive: true })

const packages: PackageInfo[] = []
const releases: Release[] = []

for (const project of projects) {
	const folder = path.basename(project)
	const pkg = loadPackage(libsDir, folder)
	const source = path.join(libsDir, folder)
	const target = path.join(packagesDir, folder)

	mkdirSync(target, { recursive: true })

	const readme = readFileSync(path.join(source, 'README.md'), 'utf8')
	writeFileSync(path.join(target, 'index.md'), rewriteReadmeLinks(readme))

	const changelog = readFileSync(path.join(source, 'CHANGELOG.md'), 'utf8')
	writeFileSync(path.join(target, 'changelog.md'), retitleChangelog(changelog, pkg.name))

	if (pkg.guides.length > 0) {
		cpSync(path.join(source, 'docs'), path.join(target, 'guides'), { recursive: true })
	}

	packages.push(pkg)
	releases.push(...parseReleases(changelog, pkg))
}

writeFileSync(path.join(packagesDir, 'packages.json'), `${JSON.stringify(packages, null, '\t')}\n`)
writeFileSync(path.join(packagesDir, 'index.md'), renderPackageIndex(packages))
writeFileSync(path.join(releasesDir, 'index.md'), renderReleases(releases))
writeFileSync(path.join(siteDir, 'api-entry.json'), `${JSON.stringify({ entryPoints: projects.map(project => `../${project}`) }, null, '\t')}\n`)

console.log(`Prepared ${packages.length} packages and ${releases.length} releases`)
