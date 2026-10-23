import type { PackageInfo } from './packages.ts'

// Appended to the package page. The list comes from package.json, so READMEs do not repeat it.
export function renderPeers(pkg: PackageInfo): string {
	if (pkg.peers.length === 0) {
		return ''
	}

	const links = pkg.peers.map(folder => `- [@svta/cml-${folder}](/packages/${folder}/)`)

	return `
## Peer dependencies

npm 7 and later installs peer dependencies with the package.

${links.join('\n')}
`
}
