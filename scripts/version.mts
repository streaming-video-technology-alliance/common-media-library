import { readFile, writeFile } from 'node:fs/promises';
import { cmd } from './cmd.mjs';

const ver = process.argv[2];

if (!ver) {
	throw new Error('Missing version number');
}

// Update package.json for all workspaces
await cmd(`npm --no-git-tag-version --allow-same-version version ${ver}`);
await cmd(`npm --no-git-tag-version --allow-same-version version ${ver} -ws`);

// Update the CHANGELOG
const changelog = await readFile('./CHANGELOG.md', 'utf8');
const sections = changelog.split(/^## /m);
sections.splice(2, 0, `[${ver}] - ????-??-??\n\n`);

const head = /\/v([0-9.]+)...HEAD/;
const linkBreak = '\n';
const last = sections.length - 1;
const links = sections[last].split(linkBreak);
const index = links.findIndex((link) => head.test(link));
const unreleased = links[index];
const previous = unreleased.match(head)?.[1];
links[index] = unreleased.replace(head, `/v${ver}...HEAD`);
links.splice(index + 1, 0, `[${ver}]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v${previous}...v${ver}`);
sections[last] = links.join(linkBreak);

await writeFile('./CHANGELOG.md', sections.join('## '));
