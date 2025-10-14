import { glob, readFile, writeFile } from 'node:fs/promises';
import { cmd } from './cmd.ts';
import { exec } from './exec.ts';

type PackageName = string;
type PackageVersion = string;
type PackageFile = string;
type PackagePeerDependencies = Record<string, string>;
type PackageJson = {
	name: PackageName;
	version: PackageVersion;
	peerDependencies: PackagePeerDependencies;
};

await cmd('npm test');

const files = await glob('libs/**/package.json');
const packages: Record<PackageName, [PackageFile, PackageVersion, PackagePeerDependencies, PackageJson]> = {};

for await (const file of files) {
	const packageJson = JSON.parse(await readFile(file, 'utf8'));
	packages[packageJson.name] = [file, packageJson.version, packageJson.peerDependencies, packageJson];
}

for (const [name, pkg] of Object.entries(packages)) {
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

	const latest = await exec(`npm view ${name} version`);
	const updated = latest < version;

	// if (!updated) {
	// 	const [peerDependencies, dependencies] = await Promise.all([
	// 		exec(`npm view ${name} peerDependencies`).then(JSON.parse),
	// 		exec(`npm view ${name} dependencies`).then(JSON.parse),
	// 	]);

	// 	const deps = { ...peerDependencies, ...dependencies };

	// 	for (const dep in deps) {
	// 		const { version } = deps[dep];
	// 		if (packages[dep] && packages[dep][1] < version) {
	// 			throw new Error(`Package ${name} needs to update peerDependency ${dep}. Version is ${version} but ${packages[dep][1]} is required.`);
	// 		}
	// 	}
	// }

	if (updated) {
		await cmd(`npm publish --provenance --access public -w libs/${name.replace('@svta/cml-', '')} --dry-run`);
	}
}
