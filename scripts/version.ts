import { readFile, writeFile } from 'node:fs/promises'
import { cmd } from './cmd.ts'

const pkg = process.argv[2]
const ver = process.argv[3]

if (!pkg) {
	throw new Error('Missing package name')
}

if (!ver) {
	throw new Error('Missing version number')
}

const folder = `libs/${pkg}`

// Update package.json for all workspaces
await cmd(`npm --no-git-tag-version --allow-same-version version ${ver} -w ${folder}`)

// Update the CHANGELOG
const changelog = await readFile(`${folder}/CHANGELOG.md`, 'utf8')
const sections = changelog.split(/^## /m)
sections.splice(2, 0, `[${ver}] - ????-??-??\n\n`)

const version = `${pkg}-v${ver}`
// Matched on the package's own tag prefix so a `v` inside the package name
// (structured-field-values, webvtt) cannot be mistaken for the version's `v`.
// Plain string search rather than a regex: `pkg` is a command-line argument.
const tagPrefix = `${pkg}-v`
const headSuffix = '...HEAD'
const linkBreak = '\n'
const last = sections.length - 1
const links = sections[last].split(linkBreak)
const index = links.findIndex((link) => link.endsWith(headSuffix) && link.includes(tagPrefix))

if (index < 0) {
	throw new Error(`Missing ${tagPrefix}<version>${headSuffix} compare link in ${folder}/CHANGELOG.md`)
}

const unreleased = links[index]
const tagStart = unreleased.lastIndexOf(tagPrefix)
const previous = unreleased.slice(tagStart + tagPrefix.length, unreleased.length - headSuffix.length)
links[index] = unreleased.slice(0, tagStart) + version + headSuffix
links.splice(index + 1, 0, `[${ver}]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/${tagPrefix}${previous}...${version}`)
sections[last] = links.join(linkBreak)

await writeFile(`${folder}/CHANGELOG.md`, sections.join('## '))
