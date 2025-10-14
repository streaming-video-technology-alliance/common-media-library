import { glob, readFile, writeFile } from 'node:fs/promises';

type PackageName = string;
type PackageVersion = string;
type PackageFile = string;
type PackagePeerDependencies = Record<string, string>;
type PackageJson = {
	name: PackageName;
	version: PackageVersion;
	peerDependencies: PackagePeerDependencies;
};

const files = await glob('libs/**/package.json');
const packages: Record<PackageName, [PackageFile, PackageVersion, PackagePeerDependencies, PackageJson]> = {};

for await (const file of files) {
	const packageJson = JSON.parse(await readFile(file, 'utf8'));
	packages[packageJson.name] = [file, packageJson.version, packageJson.peerDependencies, packageJson];
}

for (const pkg of Object.values(packages)) {
	let changed = false;
	const [file, version, peerDependencies, packageJson] = pkg;
	for (const peerDependency in peerDependencies) {
		if (packages[peerDependency] && peerDependencies[peerDependency] === '*') {
			peerDependencies[peerDependency] = version;
			changed = true;
		}
	}
	if (changed) {
		await writeFile(file, JSON.stringify(packageJson, null, '\t') + '\n');
	}
}
