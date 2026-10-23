import { existsSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

const distDir = path.resolve(import.meta.dirname, '..', 'dist')
const limit = 2 * 1024 * 1024

const required = [
	'index.html',
	'404.html',
	'llms.txt',
	'cml-mark.svg',
	'cml-lockup-light.svg',
	'cml-lockup-dark.svg',
	'apple-touch-icon.png',
	'guide/getting-started.html',
	'packages/index.html',
	'packages/cmcd/index.html',
	'packages/cmcd/guides/user-guide.html',
	'packages/cmcd/changelog.html',
	'api/index.html',
	'api/cmcd/index.html',
	'api/cmcd/functions/encodeCmcd.html',
	'releases/index.html',
	'modules.html',
	'modules/_svta_cml-cmcd.html',
	'enums/_svta_cml-cmcd.CmcdObjectType.html',
	'documents/_svta_cml-cmcd.User_Guide.html',
]

const missing = required.filter(file => !existsSync(path.join(distDir, file)))

if (missing.length > 0) {
	console.error(`site/dist is missing:\n- ${missing.join('\n- ')}`)
	process.exit(1)
}

const chunksDir = path.join(distDir, 'assets', 'chunks')
const index = readdirSync(chunksDir).find(file => file.startsWith('@localSearchIndexroot'))

if (!index) {
	console.error('site/dist has no local search index chunk')
	process.exit(1)
}

const bytes = statSync(path.join(chunksDir, index)).size

if (bytes > limit) {
	console.error(`The search index is ${bytes} bytes. The limit is ${limit} bytes. Trim searchExcerpt or exclude pages.`)
	process.exit(1)
}

console.log(`site/dist OK. Search index ${Math.round(bytes / 1024)} KB.`)
