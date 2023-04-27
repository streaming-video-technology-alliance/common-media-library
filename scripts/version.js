import { cmd } from './cmd.js';

async function version(ver) {
	await cmd(`npm --no-git-tag-version --allow-same-version version ${ver}`);
	await cmd(`npm --no-git-tag-version --allow-same-version version ${ver} -ws`);
}

const ver = process.argv[2];

if (!ver) {
	throw new Error('Missing version number');
}

version(ver);
