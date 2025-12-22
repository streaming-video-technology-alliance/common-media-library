import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { cmd } from './cmd.ts'
import { exec } from './exec.ts'
import { projects } from './projects.ts'

type PackageName = string;
type PackageFolder = string;
type PackageFile = string;
type PackageJson = {
	name: PackageName;
	version: string;
	peerDependencies: Record<string, string>;
};
type Package = [PackageFolder, PackageFile, PackageJson];
type Packages = Record<PackageName, Package>;

async function loadPackage(folder: string): Promise<Package> {
	console.log(`Loading ${folder}...`)
	const file = path.resolve(folder, 'package.json')
	const packageJson = JSON.parse(await readFile(file, 'utf8'))
	return [folder, file, packageJson]
}

async function loadPackages(): Promise<Packages> {
	return (await Promise.all(projects.map(loadPackage)))
		.reduce((result, pkg) => {
			result[pkg[2].name] = pkg
			return result
		}, {} as Packages)
}

// Check for updates and resolve wildcard dependencies
async function processPackage(name: PackageName, pkg: Package, packages: Packages): Promise<string> {
	console.log(`Processing ${name}...`)
	const [folder, file, packageJson] = pkg
	const { version, peerDependencies = {} } = packageJson

	let peersUpdated = false
	Object.entries(peerDependencies).forEach(([dep, version]) => {
		if (!packages[dep] || version !== '*') {
			return
		}

		peersUpdated = true
		peerDependencies[dep] = packages[dep][2].version
	})

	if (peersUpdated) {
		await writeFile(file, JSON.stringify(packageJson, null, '\t') + '\n')
	}

	const latest = await exec(`npm view ${name} version`)
	const updated = latest !== version
	const deps = await exec(`npm view ${name} peerDependencies --json`)

	if (!updated && deps) {
		const peerDependencies = JSON.parse(deps)

		for (const dep in peerDependencies) {
			// TODO: Remove the wildcard check after first successful publish.
			if (!packages[dep] || peerDependencies[dep] === '*') {
				continue
			}

			const version = peerDependencies[dep]

			if (version < packages[dep][1]) {
				throw new Error(`Package ${name} (${version}) needs to update its version because ${dep}'s version (${packages[dep][1]}) has changed.`)
			}
		}
	}

	return updated ? folder : ''
}

const packages = await loadPackages()
const needsPublish = await Promise.all(
	Object
		.entries(packages)
		.map(([name, pkg]) => processPackage(name, pkg, packages))
)

// Publish the packages
for (const folder of needsPublish) {
	if (!folder) {
		continue
	}

	await cmd(`npm publish --provenance --access public --dry-run -w ${folder}`)
}
