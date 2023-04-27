import { readFile, writeFile } from 'node:fs/promises';
import { cmd } from './cmd.js';

const ver = process.argv[2];

if (!ver) {
	throw new Error('Missing version number');
}

// Update package.json for all workspaces
await cmd(`npm --no-git-tag-version --allow-same-version version ${ver}`);
await cmd(`npm --no-git-tag-version --allow-same-version version ${ver} -ws`);

// Update the CHANGELOG
const sectionBreak = '\n\n\n';
const changelog = await readFile('./CHANGELOG.md', 'utf8');
const sections = changelog.split(sectionBreak);
sections.splice(1, 0, `## [${ver}] - ????-??-??`);

const head = /\/v([0-9.]+)...HEAD/;
const linkBreak = '\n';
const last = sections.length - 1;
const links = sections[last].split(linkBreak);
const first = links[0];
const previous = first.match(head)?.[1];
links[0] = first.replace(head, `/v${ver}...HEAD`);
links.splice(1, 0, `[${ver}]\\: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v${previous}...v${ver}  `);
sections[last] = links.join(linkBreak);

await writeFile('./CHANGELOG.md', sections.join(sectionBreak));
