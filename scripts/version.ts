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
const head = /v([0-9a-zA-Z.-]+)...HEAD/
const linkBreak = '\n'
const last = sections.length - 1
const links = sections[last].split(linkBreak)
const index = links.findIndex((link) => head.test(link))
const unreleased = links[index]
const previous = unreleased.match(head)?.[1]
links[index] = unreleased.replace(/\/[0-9a-z-]+v[0-9a-zA-Z.-]+...HEAD/, `/${version}...HEAD`)
links.splice(index + 1, 0, `[${ver}]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/${pkg}-v${previous}...${version}`)
sections[last] = links.join(linkBreak)

await writeFile(`${folder}/CHANGELOG.md`, sections.join('## '))
