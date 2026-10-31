import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { siteBase } from './base.ts'
import type { PackageInfo } from './packages.ts'
import { redirectHtml, redirectsFor } from './redirects.ts'

const siteDir = path.resolve(import.meta.dirname, '..')
const apiDir = path.join(siteDir, 'api')
const distDir = path.join(siteDir, 'dist')
const base = siteBase()

if (!existsSync(distDir)) {
	throw new Error(`${distDir} does not exist. Run "vitepress build" first.`)
}

const packages = JSON.parse(
	readFileSync(path.join(siteDir, 'packages', 'packages.json'), 'utf8'),
) as PackageInfo[]
const apiFiles = readdirSync(apiDir, { recursive: true })
	.map(file => String(file).split(path.sep).join('/'))
	.filter(file => file.endsWith('.md'))

const redirects = redirectsFor(packages, apiFiles)

for (const redirect of redirects) {
	const target = path.join(distDir, redirect.from)

	if (existsSync(target)) {
		throw new Error(`Redirect stub ${redirect.from} would overwrite a page of the new site.`)
	}

	mkdirSync(path.dirname(target), { recursive: true })
	writeFileSync(target, redirectHtml(redirect, base))
}

console.log(`Wrote ${redirects.length} redirect stubs`)
