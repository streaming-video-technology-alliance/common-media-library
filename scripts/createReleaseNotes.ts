import { readFile, writeFile } from 'node:fs/promises'

function release(pkg: string, version: string, changes: string) {
	return `# @svta/cml-${pkg} - ${version}

## Release Notes

${changes}

## Documentation
- API Docs: https://streaming-video-technology-alliance.github.io/common-media-library/

## NPM Package
\`\`\`sh
npm install @svta/cml-${pkg}@${version}
\`\`\`
`
}

async function getChanges(pkg: string, version: string) {
	const changeLog = await readFile(`libs/${pkg}/CHANGELOG.md`, 'utf8')
	const logs = changeLog.split(/^## /m)
	const match = `[${version}]`
	const log = logs.find(log => log.includes(match)) || ''
	return log.split('\n\n').slice(1).join('\n\n')
}

async function getVersion(pkg: string) {
	const txt = await readFile(`libs/${pkg}/package.json`, 'utf8')
	return JSON.parse(txt).version
}

const createReleaseNotes = async (pkg: string) => {
	const version = await getVersion(pkg)
	const changes = await getChanges(pkg, version)
	const releaseNotes = release(pkg, version, changes)
	await writeFile('./RELEASE.md', releaseNotes)
}

createReleaseNotes(process.argv[2])
