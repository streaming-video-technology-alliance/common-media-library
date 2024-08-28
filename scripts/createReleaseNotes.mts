import { readFile, writeFile } from 'node:fs/promises';

function release(version: string, changes: string) {
	return `## Release Notes

${changes}

## Documentation
- API Docs: https://streaming-video-technology-alliance.github.io/common-media-library/

## NPM Package
\`\`\`sh
npm install @svta/common-media-library@${version}
\`\`\`
`;
}

async function getChanges(version: string) {
	const changeLog = await readFile('./CHANGELOG.md', 'utf8');
	const logs = changeLog.split('\n\n\n');
	const match = `## [${version}]`;
	const log = logs.find(log => log.includes(match)) || '';
	return log.split('\n\n').slice(1).join('\n\n');
}

async function getVersion() {
	const txt = await readFile('./package.json', 'utf8');
	return JSON.parse(txt).version;
}

const createReleaseNotes = async () => {
	const version = await getVersion();
	const changes = await getChanges(version);
	const releaseNotes = release(version, changes);
	await writeFile('./RELEASE.md', releaseNotes);
};

createReleaseNotes();
