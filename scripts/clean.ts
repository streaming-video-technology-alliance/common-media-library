import { glob, rm } from 'node:fs/promises'

const files = glob('**/dist', { exclude: ['**/node_modules'] })

for await (const file of files) {
	await rm(file, { recursive: true, force: true })
}
